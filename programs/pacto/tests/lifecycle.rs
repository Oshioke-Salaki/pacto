//! End-to-end tests for the pacto program on LiteSVM.
//!
//! Each test builds a fresh SVM, a 6-decimal test mint, funded buyers, and
//! walks the state machine through one scenario. Time is controlled by
//! rewriting the Clock sysvar.

use {
    anchor_lang::{
        prelude::{Clock, Pubkey, Rent},
        solana_program::{instruction::Instruction, system_instruction, system_program},
        AccountDeserialize, InstructionData, ToAccountMetas,
    },
    anchor_spl::{associated_token, token},
    litesvm::LiteSVM,
    pacto::{
        instructions::{CreateGroupOrderArgs, InitializeConfigArgs},
        state::{Config, GoStatus, GroupOrder, Participation},
    },
    solana_keypair::Keypair,
    solana_message::{Message, VersionedMessage},
    solana_signer::Signer,
    solana_transaction::versioned::VersionedTransaction,
};

const DAY: i64 = 86_400;
const USDC: u64 = 1_000_000; // 6 decimals
const FEE_BPS: u16 = 150; // 1.5%
const ADVANCE_BPS: u16 = 5_000; // 50%
const START_TS: i64 = 1_800_000_000;

struct World {
    svm: LiteSVM,
    program_id: Pubkey,
    admin: Keypair,
    treasury: Keypair,
    arbiter: Keypair,
    organizer: Keypair,
    buyers: Vec<Keypair>,
    mint: Pubkey,
    config: Pubkey,
}

impl World {
    fn new(n_buyers: usize) -> Self {
        let program_id = pacto::id();
        let mut svm = LiteSVM::new();
        let bytes = include_bytes!(concat!(env!("CARGO_TARGET_TMPDIR"), "/../deploy/pacto.so"));
        svm.add_program(program_id, bytes).unwrap();

        let admin = Keypair::new();
        let treasury = Keypair::new();
        let arbiter = Keypair::new();
        let organizer = Keypair::new();
        let buyers: Vec<Keypair> = (0..n_buyers).map(|_| Keypair::new()).collect();
        for k in [&admin, &treasury, &arbiter, &organizer].into_iter().chain(buyers.iter()) {
            svm.airdrop(&k.pubkey(), 10_000_000_000).unwrap();
        }

        let mut w = World {
            svm,
            program_id,
            admin,
            treasury,
            arbiter,
            organizer,
            buyers,
            mint: Pubkey::default(),
            config: Pubkey::find_program_address(&[pacto::constants::CONFIG_SEED], &program_id).0,
        };
        w.set_time(START_TS);
        w.mint = w.create_mint(6);
        for i in 0..n_buyers {
            let b = w.buyers[i].pubkey();
            w.mint_to(&b, 1_000 * USDC);
        }
        w
    }

    fn set_time(&mut self, ts: i64) {
        let mut clock: Clock = self.svm.get_sysvar();
        clock.unix_timestamp = ts;
        self.svm.set_sysvar(&clock);
    }

    fn send(&mut self, ixs: &[Instruction], payer: &Keypair, signers: &[&Keypair]) -> Result<(), String> {
        self.svm.expire_blockhash();
        let blockhash = self.svm.latest_blockhash();
        let msg = Message::new_with_blockhash(ixs, Some(&payer.pubkey()), &blockhash);
        let mut all: Vec<&Keypair> = vec![payer];
        for s in signers {
            if s.pubkey() != payer.pubkey() {
                all.push(s);
            }
        }
        let tx = VersionedTransaction::try_new(VersionedMessage::Legacy(msg), &all).unwrap();
        match self.svm.send_transaction(tx) {
            Ok(_) => Ok(()),
            Err(e) => Err(e.meta.logs.join("\n")),
        }
    }

    fn create_mint(&mut self, decimals: u8) -> Pubkey {
        let mint = Keypair::new();
        let rent: Rent = self.svm.get_sysvar();
        let lamports = rent.minimum_balance(token::Mint::LEN);
        let create = system_instruction::create_account(
            &self.admin.pubkey(),
            &mint.pubkey(),
            lamports,
            token::Mint::LEN as u64,
            &token::ID,
        );
        let init = token::spl_token::instruction::initialize_mint2(
            &token::ID,
            &mint.pubkey(),
            &self.admin.pubkey(),
            None,
            decimals,
        )
        .unwrap();
        let admin = self.admin.insecure_clone();
        self.send(&[create, init], &admin, &[&mint]).unwrap();
        mint.pubkey()
    }

    fn ata(&self, owner: &Pubkey) -> Pubkey {
        associated_token::get_associated_token_address(owner, &self.mint)
    }

    fn mint_to(&mut self, owner: &Pubkey, amount: u64) {
        let create = associated_token::spl_associated_token_account::instruction::create_associated_token_account_idempotent(
            &self.admin.pubkey(),
            owner,
            &self.mint,
            &token::ID,
        );
        let mint_to = token::spl_token::instruction::mint_to(
            &token::ID,
            &self.mint,
            &self.ata(owner),
            &self.admin.pubkey(),
            &[],
            amount,
        )
        .unwrap();
        let admin = self.admin.insecure_clone();
        self.send(&[create, mint_to], &admin, &[]).unwrap();
    }

    fn balance(&self, owner: &Pubkey) -> u64 {
        match self.svm.get_account(&self.ata(owner)) {
            Some(acc) => {
                let data: &[u8] = &acc.data;
                // SPL token account layout: amount at bytes 64..72
                u64::from_le_bytes(data[64..72].try_into().unwrap())
            }
            None => 0,
        }
    }

    fn vault_balance(&self, go: &Pubkey) -> u64 {
        let vault = associated_token::get_associated_token_address(go, &self.mint);
        match self.svm.get_account(&vault) {
            Some(acc) if !acc.data.is_empty() => u64::from_le_bytes(acc.data[64..72].try_into().unwrap()),
            _ => 0,
        }
    }

    fn init_config(&mut self) {
        let ix = Instruction::new_with_bytes(
            self.program_id,
            &pacto::instruction::InitializeConfig {
                args: InitializeConfigArgs {
                    allowed_mint: self.mint,
                    fee_bps: FEE_BPS,
                    max_advance_bps: 5_000,
                    treasury: self.treasury.pubkey(),
                    default_arbiter: self.arbiter.pubkey(),
                },
            }
            .data(),
            pacto::accounts::InitializeConfig {
                admin: self.admin.pubkey(),
                config: self.config,
                system_program: system_program::ID,
            }
            .to_account_metas(None),
        );
        let admin = self.admin.insecure_clone();
        self.send(&[ix], &admin, &[]).unwrap();
    }

    fn go_pda(&self, go_id: u64) -> Pubkey {
        Pubkey::find_program_address(
            &[pacto::constants::GROUP_ORDER_SEED, self.organizer.pubkey().as_ref(), &go_id.to_le_bytes()],
            &self.program_id,
        )
        .0
    }

    fn participation_pda(&self, go: &Pubkey, buyer: &Pubkey) -> Pubkey {
        Pubkey::find_program_address(
            &[pacto::constants::PARTICIPATION_SEED, go.as_ref(), buyer.as_ref()],
            &self.program_id,
        )
        .0
    }

    fn default_args(&self, go_id: u64) -> CreateGroupOrderArgs {
        CreateGroupOrderArgs {
            go_id,
            title: "ENHYPEN Dark Blood GO".into(),
            description: "Bulk order from Seoul, split shipping.".into(),
            details_uri: "https://x.com/gom/status/1".into(),
            image_uri: "https://example.com/cover.jpg".into(),
            unit_price: 40 * USDC,
            min_qty: 3,
            max_qty: 10,
            advance_bps: ADVANCE_BPS,
            join_deadline: START_TS + 7 * DAY,
            ship_by_secs: 30 * DAY,
            delivery_window_secs: 14 * DAY,
            arbiter: None,
        }
    }

    fn create_go(&mut self, args: CreateGroupOrderArgs) -> Result<Pubkey, String> {
        let go = self.go_pda(args.go_id);
        let ix = Instruction::new_with_bytes(
            self.program_id,
            &pacto::instruction::CreateGroupOrder { args }.data(),
            pacto::accounts::CreateGroupOrder {
                organizer: self.organizer.pubkey(),
                config: self.config,
                group_order: go,
                mint: self.mint,
                vault: associated_token::get_associated_token_address(&go, &self.mint),
                token_program: token::ID,
                associated_token_program: associated_token::ID,
                system_program: system_program::ID,
            }
            .to_account_metas(None),
        );
        let org = self.organizer.insecure_clone();
        self.send(&[ix], &org, &[])?;
        Ok(go)
    }

    fn join(&mut self, go: &Pubkey, buyer_idx: usize, qty: u32) -> Result<(), String> {
        let buyer = self.buyers[buyer_idx].insecure_clone();
        let ix = Instruction::new_with_bytes(
            self.program_id,
            &pacto::instruction::Join { qty }.data(),
            pacto::accounts::Join {
                buyer: buyer.pubkey(),
                config: self.config,
                group_order: *go,
                participation: self.participation_pda(go, &buyer.pubkey()),
                mint: self.mint,
                vault: associated_token::get_associated_token_address(go, &self.mint),
                buyer_token_account: self.ata(&buyer.pubkey()),
                token_program: token::ID,
                associated_token_program: associated_token::ID,
                system_program: system_program::ID,
            }
            .to_account_metas(None),
        );
        self.send(&[ix], &buyer, &[])
    }

    fn buyer_exit(&mut self, go: &Pubkey, buyer_idx: usize, data: Vec<u8>) -> Result<(), String> {
        let buyer = self.buyers[buyer_idx].insecure_clone();
        let ix = Instruction::new_with_bytes(
            self.program_id,
            &data,
            pacto::accounts::BuyerExit {
                buyer: buyer.pubkey(),
                group_order: *go,
                participation: self.participation_pda(go, &buyer.pubkey()),
                mint: self.mint,
                vault: associated_token::get_associated_token_address(go, &self.mint),
                buyer_token_account: self.ata(&buyer.pubkey()),
                token_program: token::ID,
                associated_token_program: associated_token::ID,
                system_program: system_program::ID,
            }
            .to_account_metas(None),
        );
        self.send(&[ix], &buyer, &[])
    }

    fn leave(&mut self, go: &Pubkey, buyer_idx: usize) -> Result<(), String> {
        self.buyer_exit(go, buyer_idx, pacto::instruction::Leave {}.data())
    }

    fn claim_refund(&mut self, go: &Pubkey, buyer_idx: usize) -> Result<(), String> {
        self.buyer_exit(go, buyer_idx, pacto::instruction::ClaimRefund {}.data())
    }

    fn lock(&mut self, go: &Pubkey, signer: &Keypair) -> Result<(), String> {
        let ix = Instruction::new_with_bytes(
            self.program_id,
            &pacto::instruction::Lock {}.data(),
            pacto::accounts::Lock {
                organizer: signer.pubkey(),
                config: self.config,
                group_order: *go,
                treasury: self.treasury.pubkey(),
                mint: self.mint,
                vault: associated_token::get_associated_token_address(go, &self.mint),
                organizer_token_account: self.ata(&signer.pubkey()),
                treasury_token_account: self.ata(&self.treasury.pubkey()),
                token_program: token::ID,
                associated_token_program: associated_token::ID,
                system_program: system_program::ID,
            }
            .to_account_metas(None),
        );
        let s = signer.insecure_clone();
        self.send(&[ix], &s, &[])
    }

    fn cancel(&mut self, go: &Pubkey, signer: &Keypair) -> Result<(), String> {
        let ix = Instruction::new_with_bytes(
            self.program_id,
            &pacto::instruction::Cancel {}.data(),
            pacto::accounts::Cancel { signer: signer.pubkey(), group_order: *go }.to_account_metas(None),
        );
        let s = signer.insecure_clone();
        self.send(&[ix], &s, &[])
    }

    fn mark_shipped(&mut self, go: &Pubkey, signer: &Keypair) -> Result<(), String> {
        let ix = Instruction::new_with_bytes(
            self.program_id,
            &pacto::instruction::MarkShipped { shipment_ref: "BR123456789".into() }.data(),
            pacto::accounts::MarkShipped { organizer: signer.pubkey(), group_order: *go }.to_account_metas(None),
        );
        let s = signer.insecure_clone();
        self.send(&[ix], &s, &[])
    }

    fn settle(&mut self, go: &Pubkey, buyer_idx: usize, signer: &Keypair, data: Vec<u8>) -> Result<(), String> {
        let buyer = self.buyers[buyer_idx].pubkey();
        let ix = Instruction::new_with_bytes(
            self.program_id,
            &data,
            pacto::accounts::Settle {
                signer: signer.pubkey(),
                config: self.config,
                group_order: *go,
                participation: self.participation_pda(go, &buyer),
                buyer,
                organizer: self.organizer.pubkey(),
                treasury: self.treasury.pubkey(),
                mint: self.mint,
                vault: associated_token::get_associated_token_address(go, &self.mint),
                buyer_token_account: self.ata(&buyer),
                organizer_token_account: self.ata(&self.organizer.pubkey()),
                treasury_token_account: self.ata(&self.treasury.pubkey()),
                token_program: token::ID,
                associated_token_program: associated_token::ID,
                system_program: system_program::ID,
            }
            .to_account_metas(None),
        );
        let s = signer.insecure_clone();
        self.send(&[ix], &s, &[])
    }

    fn confirm(&mut self, go: &Pubkey, buyer_idx: usize) -> Result<(), String> {
        let b = self.buyers[buyer_idx].insecure_clone();
        self.settle(go, buyer_idx, &b, pacto::instruction::ConfirmReceipt {}.data())
    }

    fn release_expired(&mut self, go: &Pubkey, buyer_idx: usize, signer: &Keypair) -> Result<(), String> {
        self.settle(go, buyer_idx, signer, pacto::instruction::ReleaseExpired {}.data())
    }

    fn resolve(&mut self, go: &Pubkey, buyer_idx: usize, signer: &Keypair, refund_buyer: bool) -> Result<(), String> {
        self.settle(go, buyer_idx, signer, pacto::instruction::ResolveDispute { refund_buyer }.data())
    }

    fn dispute(&mut self, go: &Pubkey, buyer_idx: usize) -> Result<(), String> {
        let buyer = self.buyers[buyer_idx].insecure_clone();
        let ix = Instruction::new_with_bytes(
            self.program_id,
            &pacto::instruction::OpenDispute {}.data(),
            pacto::accounts::OpenDispute {
                buyer: buyer.pubkey(),
                group_order: *go,
                participation: self.participation_pda(go, &buyer.pubkey()),
            }
            .to_account_metas(None),
        );
        self.send(&[ix], &buyer, &[])
    }

    fn close_vault(&mut self, go: &Pubkey) -> Result<(), String> {
        let org = self.organizer.insecure_clone();
        let ix = Instruction::new_with_bytes(
            self.program_id,
            &pacto::instruction::CloseVault {}.data(),
            pacto::accounts::CloseVault {
                organizer: org.pubkey(),
                group_order: *go,
                mint: self.mint,
                vault: associated_token::get_associated_token_address(go, &self.mint),
                organizer_token_account: self.ata(&org.pubkey()),
                token_program: token::ID,
                associated_token_program: associated_token::ID,
                system_program: system_program::ID,
            }
            .to_account_metas(None),
        );
        self.send(&[ix], &org, &[])
    }

    fn go_state(&self, go: &Pubkey) -> GroupOrder {
        let acc = self.svm.get_account(go).unwrap();
        let mut data: &[u8] = &acc.data;
        GroupOrder::try_deserialize(&mut data).unwrap()
    }

    fn participation(&self, go: &Pubkey, buyer_idx: usize) -> Option<Participation> {
        let pda = self.participation_pda(go, &self.buyers[buyer_idx].pubkey());
        let acc = self.svm.get_account(&pda)?;
        if acc.data.is_empty() {
            return None;
        }
        let mut data: &[u8] = &acc.data;
        Participation::try_deserialize(&mut data).ok()
    }
}

fn assert_err<T>(res: Result<T, String>, code: &str) {
    match res {
        Ok(_) => panic!("expected error {code}, got success"),
        Err(logs) => assert!(logs.contains(code), "expected {code} in logs:\n{logs}"),
    }
}

fn bps(amount: u64, b: u16) -> u64 {
    amount * b as u64 / 10_000
}

#[test]
fn config_initializes() {
    let mut w = World::new(0);
    w.init_config();
    let acc = w.svm.get_account(&w.config).unwrap();
    let mut data: &[u8] = &acc.data;
    let cfg = Config::try_deserialize(&mut data).unwrap();
    assert_eq!(cfg.admin, w.admin.pubkey());
    assert_eq!(cfg.fee_bps, FEE_BPS);
    assert_eq!(cfg.allowed_mint, w.mint);
    assert!(!cfg.paused);
}

#[test]
fn happy_path_confirm_dispute_and_timeout() {
    let mut w = World::new(3);
    w.init_config();
    let go = w.create_go(w.default_args(1)).unwrap();

    // Buyer 0 joins twice (tops up), buyer 1 and 2 once.
    w.join(&go, 0, 1).unwrap();
    w.join(&go, 0, 1).unwrap();
    w.join(&go, 1, 2).unwrap();
    w.join(&go, 2, 1).unwrap();
    let s = w.go_state(&go);
    assert_eq!(s.total_qty, 5);
    assert_eq!(s.participants, 3);
    assert_eq!(s.total_paid, 200 * USDC);
    assert_eq!(w.participation(&go, 0).unwrap().paid, 80 * USDC);
    assert_eq!(w.vault_balance(&go), 200 * USDC);

    // Organizer locks early (minimum met).
    let org = w.organizer.insecure_clone();
    w.lock(&go, &org).unwrap();
    let s = w.go_state(&go);
    assert_eq!(s.status, GoStatus::Locked);
    let advance = bps(200 * USDC, ADVANCE_BPS);
    let fee = bps(advance, FEE_BPS);
    assert_eq!(s.advance_paid, advance);
    assert_eq!(w.balance(&w.organizer.pubkey()), advance - fee);
    assert_eq!(w.balance(&w.treasury.pubkey()), fee);

    // Joining after lock fails; leaving after lock fails.
    assert_err(w.join(&go, 2, 1), "InvalidStatus");
    assert_err(w.leave(&go, 2), "InvalidStatus");

    // Ship within window.
    w.set_time(START_TS + 10 * DAY);
    w.mark_shipped(&go, &org).unwrap();
    assert_eq!(w.go_state(&go).status, GoStatus::Shipped);

    // Buyer 0 confirms: remainder minus fee to organizer.
    let org_before = w.balance(&w.organizer.pubkey());
    w.confirm(&go, 0).unwrap();
    let rem0 = 80 * USDC - (80 * USDC * ADVANCE_BPS as u64 + 9_999) / 10_000;
    let fee0 = bps(rem0, FEE_BPS);
    assert_eq!(w.balance(&w.organizer.pubkey()), org_before + rem0 - fee0);
    assert!(w.participation(&go, 0).is_none(), "participation closed after confirm");

    // Buyer 1 disputes; arbiter refunds buyer.
    w.dispute(&go, 1).unwrap();
    assert_err(w.confirm(&go, 1), "InDispute");
    assert_err(w.dispute(&go, 1), "AlreadyDisputed");
    let rando = Keypair::new();
    w.svm.airdrop(&rando.pubkey(), 1_000_000_000).unwrap();
    assert_err(w.resolve(&go, 1, &rando, true), "Unauthorized");
    let b1_before = w.balance(&w.buyers[1].pubkey());
    let arb = w.arbiter.insecure_clone();
    w.resolve(&go, 1, &arb, true).unwrap();
    let rem1 = 80 * USDC - (80 * USDC * ADVANCE_BPS as u64 + 9_999) / 10_000;
    assert_eq!(w.balance(&w.buyers[1].pubkey()), b1_before + rem1);
    assert_eq!(w.go_state(&go).disputes_lost, 1);

    // Buyer 2 ghosts. Before deliver_by nobody can release.
    assert_err(w.release_expired(&go, 2, &rando), "WindowNotExpired");
    w.set_time(START_TS + 10 * DAY + 14 * DAY + 1);
    // Dispute window closed.
    assert_err(w.dispute(&go, 2), "WindowExpired");
    // Permissionless release by a crank.
    w.release_expired(&go, 2, &rando).unwrap();

    let s = w.go_state(&go);
    assert_eq!(s.status, GoStatus::Completed);
    assert_eq!(s.settled, 3);

    // Dust is at most one base unit per buyer; organizer sweeps and closes.
    assert!(w.vault_balance(&go) <= 3);
    w.close_vault(&go).unwrap();
    assert_eq!(w.vault_balance(&go), 0);
}

#[test]
fn cancel_when_minimum_not_met_and_full_refunds() {
    let mut w = World::new(2);
    w.init_config();
    let go = w.create_go(w.default_args(2)).unwrap();
    w.join(&go, 0, 1).unwrap();
    w.join(&go, 1, 1).unwrap();

    let rando = Keypair::new();
    w.svm.airdrop(&rando.pubkey(), 1_000_000_000).unwrap();
    // Before the deadline only the organizer can cancel.
    assert_err(w.cancel(&go, &rando), "DeadlineNotReached");
    // Organizer cannot lock below minimum.
    let org = w.organizer.insecure_clone();
    assert_err(w.lock(&go, &org), "MinimumNotMet");

    w.set_time(START_TS + 7 * DAY);
    assert_err(w.join(&go, 0, 1), "DeadlinePassed");
    w.cancel(&go, &rando).unwrap();
    assert_eq!(w.go_state(&go).status, GoStatus::Cancelled);

    let before = w.balance(&w.buyers[0].pubkey());
    w.claim_refund(&go, 0).unwrap();
    assert_eq!(w.balance(&w.buyers[0].pubkey()), before + 40 * USDC);
    assert_err(w.close_vault(&go), "VaultNotEmpty");
    w.claim_refund(&go, 1).unwrap();
    w.close_vault(&go).unwrap();
}

#[test]
fn organizer_never_ships_buyers_reclaim_remainder() {
    let mut w = World::new(3);
    w.init_config();
    let go = w.create_go(w.default_args(3)).unwrap();
    for i in 0..3 {
        w.join(&go, i, 1).unwrap();
    }
    let org = w.organizer.insecure_clone();
    w.lock(&go, &org).unwrap();

    // Too early to reclaim.
    assert_err(w.claim_refund(&go, 0), "WindowNotExpired");
    w.set_time(START_TS + 30 * DAY + 1);
    let before = w.balance(&w.buyers[0].pubkey());
    w.claim_refund(&go, 0).unwrap();
    let rem = 40 * USDC - (40 * USDC * ADVANCE_BPS as u64 + 9_999) / 10_000;
    assert_eq!(w.balance(&w.buyers[0].pubkey()), before + rem);

    // Once wind-down began, a late shipment is rejected.
    assert_err(w.mark_shipped(&go, &org), "WindDown");

    w.claim_refund(&go, 1).unwrap();
    w.claim_refund(&go, 2).unwrap();
    assert_eq!(w.go_state(&go).status, GoStatus::Expired);
    w.close_vault(&go).unwrap();
}

#[test]
fn late_shipment_allowed_if_nobody_exited() {
    let mut w = World::new(3);
    w.init_config();
    let go = w.create_go(w.default_args(4)).unwrap();
    for i in 0..3 {
        w.join(&go, i, 1).unwrap();
    }
    let org = w.organizer.insecure_clone();
    w.lock(&go, &org).unwrap();
    w.set_time(START_TS + 32 * DAY);
    w.mark_shipped(&go, &org).unwrap();
    assert_eq!(w.go_state(&go).status, GoStatus::Shipped);
}

#[test]
fn leave_rules_and_commitment() {
    let mut w = World::new(3);
    w.init_config();
    let go = w.create_go(w.default_args(5)).unwrap();
    for i in 0..3 {
        w.join(&go, i, 1).unwrap();
    }
    // Leave before the deadline is a full refund and decrements totals.
    let before = w.balance(&w.buyers[2].pubkey());
    w.leave(&go, 2).unwrap();
    assert_eq!(w.balance(&w.buyers[2].pubkey()), before + 40 * USDC);
    let s = w.go_state(&go);
    assert_eq!(s.participants, 2);
    assert_eq!(s.total_qty, 2);

    // Rejoin, reach minimum, pass deadline: positions are committed.
    w.join(&go, 2, 1).unwrap();
    w.set_time(START_TS + 7 * DAY);
    assert_err(w.leave(&go, 0), "Committed");

    // Organizer silent through the grace period: anyone can cancel.
    let rando = Keypair::new();
    w.svm.airdrop(&rando.pubkey(), 1_000_000_000).unwrap();
    assert_err(w.cancel(&go, &rando), "MinimumAlreadyMet");
    w.set_time(START_TS + 7 * DAY + 7 * DAY);
    w.cancel(&go, &rando).unwrap();
    assert_eq!(w.go_state(&go).status, GoStatus::Cancelled);
}

#[test]
fn creation_validations() {
    let mut w = World::new(0);
    w.init_config();

    let mut a = w.default_args(10);
    a.arbiter = Some(w.organizer.pubkey());
    assert_err(w.create_go(a), "ArbiterIsOrganizer");

    let mut a = w.default_args(11);
    a.advance_bps = 5_001;
    assert_err(w.create_go(a), "InvalidAdvance");

    let mut a = w.default_args(12);
    a.min_qty = 5;
    a.max_qty = 4;
    assert_err(w.create_go(a), "InvalidQuantity");

    let mut a = w.default_args(13);
    a.join_deadline = START_TS - 1;
    assert_err(w.create_go(a), "InvalidWindow");

    let mut a = w.default_args(14);
    a.title = "x".repeat(65);
    assert_err(w.create_go(a), "TitleTooLong");

    let mut a = w.default_args(15);
    a.description = "x".repeat(281);
    assert_err(w.create_go(a), "DescriptionTooLong");

    let mut a = w.default_args(16);
    a.unit_price = 0;
    assert_err(w.create_go(a), "InvalidPrice");

    // Different mint is rejected by the allowlist.
    let other = w.create_mint(6);
    let saved = w.mint;
    w.mint = other;
    assert_err(w.create_go(w.default_args(17)), "MintNotAllowed");
    w.mint = saved;
}

#[test]
fn join_limits_and_unauthorized_actions() {
    let mut w = World::new(2);
    w.init_config();
    let go = w.create_go(w.default_args(20)).unwrap();
    assert_err(w.join(&go, 0, 0), "InvalidQuantity");
    assert_err(w.join(&go, 0, 11), "MaxQuantityExceeded");
    w.join(&go, 0, 10).unwrap();
    assert_err(w.join(&go, 1, 1), "MaxQuantityExceeded");

    // Only the organizer may lock or mark shipped.
    let rando = Keypair::new();
    w.svm.airdrop(&rando.pubkey(), 1_000_000_000).unwrap();
    assert_err(w.lock(&go, &rando), "Unauthorized");
    let org = w.organizer.insecure_clone();
    w.lock(&go, &org).unwrap();
    assert_err(w.mark_shipped(&go, &rando), "Unauthorized");
}

#[test]
fn unresolved_dispute_falls_back_to_buyer_after_arbitration_window() {
    let mut w = World::new(1);
    w.init_config();
    let mut a = w.default_args(30);
    a.min_qty = 1;
    let go = w.create_go(a).unwrap();
    w.join(&go, 0, 1).unwrap();
    let org = w.organizer.insecure_clone();
    w.lock(&go, &org).unwrap();
    w.mark_shipped(&go, &org).unwrap();
    w.dispute(&go, 0).unwrap();

    // Organizer cannot force-release a disputed position even after deliver_by.
    w.set_time(START_TS + 14 * DAY + 1);
    assert_err(w.release_expired(&go, 0, &org), "InDispute");
    // Buyer cannot reclaim before the arbitration window ends.
    assert_err(w.claim_refund(&go, 0), "WindowNotExpired");
    w.set_time(START_TS + 14 * DAY + 30 * DAY + 1);
    let before = w.balance(&w.buyers[0].pubkey());
    w.claim_refund(&go, 0).unwrap();
    let rem = 40 * USDC - (40 * USDC * ADVANCE_BPS as u64 + 9_999) / 10_000;
    assert_eq!(w.balance(&w.buyers[0].pubkey()), before + rem);
    assert_eq!(w.go_state(&go).status, GoStatus::Completed);
}

#[test]
fn paused_blocks_create_and_join() {
    let mut w = World::new(1);
    w.init_config();
    let go = w.create_go(w.default_args(40)).unwrap();
    let ix = Instruction::new_with_bytes(
        w.program_id,
        &pacto::instruction::UpdateConfig {
            args: pacto::instructions::UpdateConfigArgs {
                allowed_mint: None,
                fee_bps: None,
                max_advance_bps: None,
                treasury: None,
                default_arbiter: None,
                paused: Some(true),
                new_admin: None,
            },
        }
        .data(),
        pacto::accounts::UpdateConfig { admin: w.admin.pubkey(), config: w.config }.to_account_metas(None),
    );
    let admin = w.admin.insecure_clone();
    w.send(&[ix], &admin, &[]).unwrap();
    assert_err(w.join(&go, 0, 1), "Paused");
    assert_err(w.create_go(w.default_args(41)), "Paused");
}
