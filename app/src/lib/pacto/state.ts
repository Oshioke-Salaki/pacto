/**
 * Plain, JSON-serializable views of on-chain accounts plus the action rules
 * that mirror programs/pacto. Keep in sync with docs/PROGRAM.md.
 */

export type GoStatus = "open" | "locked" | "shipped" | "completed" | "cancelled" | "expired";

export const DAY = 86_400;
export const LOCK_GRACE_SECS = 7 * DAY;
export const ARBITRATION_WINDOW_SECS = 30 * DAY;
export const BPS = 10_000;

export interface GroupOrderView {
  address: string;
  organizer: string;
  goId: string;
  mint: string;
  vault: string;
  arbiter: string;
  title: string;
  description: string;
  detailsUri: string;
  imageUri: string;
  unitPrice: string;
  minQty: number;
  maxQty: number;
  feeBps: number;
  advanceBps: number;
  joinDeadline: number;
  shipBySecs: number;
  deliveryWindowSecs: number;
  status: GoStatus;
  totalQty: number;
  totalPaid: string;
  participants: number;
  settled: number;
  advancePaid: string;
  disputesOpened: number;
  disputesLost: number;
  createdAt: number;
  lockedAt: number;
  shippedAt: number;
  shipmentRef: string;
}

export interface ParticipationView {
  address: string;
  groupOrder: string;
  buyer: string;
  qty: number;
  paid: string;
  confirmed: boolean;
  disputed: boolean;
  joinedAt: number;
}

export interface ConfigView {
  admin: string;
  treasury: string;
  defaultArbiter: string;
  allowedMint: string;
  feeBps: number;
  maxAdvanceBps: number;
  paused: boolean;
}

/* ---------- decoding helpers (Anchor account -> view) ---------- */

type BNLike = { toString(): string; toNumber(): number };
type EnumLike = Record<string, object>;

function statusFromEnum(e: EnumLike): GoStatus {
  const key = Object.keys(e)[0]?.toLowerCase();
  if (key === "open" || key === "locked" || key === "shipped" || key === "completed" || key === "cancelled" || key === "expired") {
    return key;
  }
  throw new Error(`Unknown status ${key}`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toGroupOrderView(address: string, a: any): GroupOrderView {
  const bn = (v: BNLike) => v.toString();
  const num = (v: BNLike) => v.toNumber();
  return {
    address,
    organizer: a.organizer.toBase58(),
    goId: bn(a.goId),
    mint: a.mint.toBase58(),
    vault: a.vault.toBase58(),
    arbiter: a.arbiter.toBase58(),
    title: a.title,
    description: a.description,
    detailsUri: a.detailsUri,
    imageUri: a.imageUri,
    unitPrice: bn(a.unitPrice),
    minQty: a.minQty,
    maxQty: a.maxQty,
    feeBps: a.feeBps,
    advanceBps: a.advanceBps,
    joinDeadline: num(a.joinDeadline),
    shipBySecs: num(a.shipBySecs),
    deliveryWindowSecs: num(a.deliveryWindowSecs),
    status: statusFromEnum(a.status),
    totalQty: a.totalQty,
    totalPaid: bn(a.totalPaid),
    participants: a.participants,
    settled: a.settled,
    advancePaid: bn(a.advancePaid),
    disputesOpened: a.disputesOpened,
    disputesLost: a.disputesLost,
    createdAt: num(a.createdAt),
    lockedAt: num(a.lockedAt),
    shippedAt: num(a.shippedAt),
    shipmentRef: a.shipmentRef,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toParticipationView(address: string, a: any): ParticipationView {
  return {
    address,
    groupOrder: a.groupOrder.toBase58(),
    buyer: a.buyer.toBase58(),
    qty: a.qty,
    paid: a.paid.toString(),
    confirmed: a.confirmed,
    disputed: a.disputed,
    joinedAt: a.joinedAt.toNumber(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toConfigView(a: any): ConfigView {
  return {
    admin: a.admin.toBase58(),
    treasury: a.treasury.toBase58(),
    defaultArbiter: a.defaultArbiter.toBase58(),
    allowedMint: a.allowedMint.toBase58(),
    feeBps: a.feeBps,
    maxAdvanceBps: a.maxAdvanceBps,
    paused: a.paused,
  };
}

/* ---------- derived timing ---------- */

export function shipBy(go: GroupOrderView) {
  return go.lockedAt + go.shipBySecs;
}
export function deliverBy(go: GroupOrderView) {
  return go.shippedAt + go.deliveryWindowSecs;
}
export function lockGraceEnd(go: GroupOrderView) {
  return go.joinDeadline + LOCK_GRACE_SECS;
}
export function arbitrationEnd(go: GroupOrderView) {
  return deliverBy(go) + ARBITRATION_WINDOW_SECS;
}

/* ---------- money math (mirrors programs/pacto/src/math.rs) ---------- */

export function mulBpsFloor(amount: bigint, bps: number) {
  return (amount * BigInt(bps)) / BigInt(BPS);
}
export function mulBpsCeil(amount: bigint, bps: number) {
  return (amount * BigInt(bps) + BigInt(BPS - 1)) / BigInt(BPS);
}
export function remainderOf(paid: bigint, advanceBps: number) {
  return paid - mulBpsCeil(paid, advanceBps);
}

/* ---------- action rules ---------- */

export type ActionId =
  | "join"
  | "leave"
  | "lock"
  | "cancel"
  | "claim_refund"
  | "mark_shipped"
  | "confirm_receipt"
  | "open_dispute"
  | "resolve_dispute"
  | "release_expired"
  | "close_vault";

export interface AllowedAction {
  id: ActionId;
  label: string;
  tone: "primary" | "secondary" | "danger";
  hint: string;
}

export interface Viewer {
  pubkey: string | null;
  participation: ParticipationView | null;
}

export function roles(go: GroupOrderView, viewer: Viewer) {
  const pk = viewer.pubkey;
  return {
    isOrganizer: !!pk && pk === go.organizer,
    isArbiter: !!pk && pk === go.arbiter,
    isBuyer: !!viewer.participation,
  };
}

/**
 * The actions the viewer can take right now. Mirrors the program's guards so
 * the UI never offers a button the chain would reject.
 */
export function allowedActions(go: GroupOrderView, viewer: Viewer, now: number): AllowedAction[] {
  const { isOrganizer, isArbiter, isBuyer } = roles(go, viewer);
  const p = viewer.participation;
  const out: AllowedAction[] = [];

  switch (go.status) {
    case "open": {
      const canJoin = now < go.joinDeadline && go.totalQty < go.maxQty;
      if (canJoin) {
        out.push({
          id: "join",
          label: isBuyer ? "Add units" : "Join this order",
          tone: "primary",
          hint: "Pay now into the escrow vault. Full refund if the order never locks.",
        });
      }
      if (isBuyer && (now < go.joinDeadline || go.totalQty < go.minQty)) {
        out.push({ id: "leave", label: "Leave and refund", tone: "secondary", hint: "Get your full payment back." });
      }
      if (isOrganizer && go.totalQty >= go.minQty) {
        out.push({
          id: "lock",
          label: "Lock and receive advance",
          tone: "primary",
          hint: `Closes joins and pays you ${go.advanceBps / 100}% of the pool to place the order.`,
        });
      }
      if (isOrganizer) {
        out.push({ id: "cancel", label: "Cancel order", tone: "danger", hint: "Everyone gets a full refund." });
      } else if (now >= go.joinDeadline && (go.totalQty < go.minQty || now >= lockGraceEnd(go))) {
        out.push({
          id: "cancel",
          label: "Cancel and unlock refunds",
          tone: "danger",
          hint: go.totalQty < go.minQty ? "Minimum was not met." : "Organizer did not lock in time.",
        });
      }
      break;
    }
    case "locked": {
      if (isOrganizer && go.settled === 0) {
        out.push({ id: "mark_shipped", label: "Mark as shipped", tone: "primary", hint: "Add a tracking code so buyers can confirm receipt." });
      }
      if (isBuyer && now > shipBy(go)) {
        out.push({ id: "claim_refund", label: "Reclaim my remainder", tone: "danger", hint: "Organizer missed the ship-by date." });
      }
      break;
    }
    case "shipped": {
      if (isBuyer && p && !p.disputed) {
        out.push({ id: "confirm_receipt", label: "Confirm I received it", tone: "primary", hint: "Releases your remaining share to the organizer." });
        if (now <= deliverBy(go)) {
          out.push({ id: "open_dispute", label: "Open a dispute", tone: "danger", hint: "Pauses your release until the arbiter decides." });
        }
      }
      if (isBuyer && p && p.disputed && now > arbitrationEnd(go)) {
        out.push({ id: "claim_refund", label: "Reclaim my remainder", tone: "danger", hint: "Arbiter did not resolve in time." });
      }
      if (isArbiter) {
        out.push({ id: "resolve_dispute", label: "Resolve disputes", tone: "primary", hint: "Refund the buyer or release to the organizer." });
      }
      if (now > deliverBy(go)) {
        out.push({ id: "release_expired", label: "Release unconfirmed shares", tone: "secondary", hint: "Delivery window passed. Anyone can settle undisputed positions." });
      }
      break;
    }
    case "cancelled": {
      if (isBuyer) {
        out.push({ id: "claim_refund", label: "Claim full refund", tone: "primary", hint: "The order was cancelled." });
      }
      break;
    }
    case "completed":
    case "expired": {
      if (isOrganizer && go.settled >= go.participants) {
        out.push({ id: "close_vault", label: "Close vault", tone: "secondary", hint: "Sweep rounding dust and recover rent." });
      }
      break;
    }
  }
  return out;
}

export const STATUS_LABEL: Record<GoStatus, string> = {
  open: "Open",
  locked: "Ordering",
  shipped: "Shipped",
  completed: "Completed",
  cancelled: "Cancelled",
  expired: "Expired",
};

export const STATUS_DESCRIPTION: Record<GoStatus, string> = {
  open: "Accepting buyers. Leave anytime for a full refund.",
  locked: "Minimum met. Organizer received the advance and is placing the bulk order.",
  shipped: "On its way. Confirm when it arrives, or dispute.",
  completed: "Every buyer settled. Counts toward the organizer's track record.",
  cancelled: "Cancelled. Buyers claim full refunds.",
  expired: "Never shipped. Buyers reclaimed their remainders.",
};
