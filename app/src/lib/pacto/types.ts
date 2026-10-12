/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/pacto.json`.
 */
export type Pacto = {
  "address": "G6aqqtwxaYjhqJhZsix3ZweJg8SJd7N6dwZLxewPokLA",
  "metadata": {
    "name": "pacto",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Escrow for group orders on Solana"
  },
  "instructions": [
    {
      "name": "cancel",
      "discriminator": [
        232,
        219,
        223,
        41,
        219,
        236,
        220,
        190
      ],
      "accounts": [
        {
          "name": "signer",
          "signer": true
        },
        {
          "name": "groupOrder",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  114,
                  111,
                  117,
                  112,
                  95,
                  111,
                  114,
                  100,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "groupOrder.organizer",
                "account": "groupOrder"
              },
              {
                "kind": "account",
                "path": "groupOrder.goId",
                "account": "groupOrder"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "claimRefund",
      "discriminator": [
        15,
        16,
        30,
        161,
        255,
        228,
        97,
        60
      ],
      "accounts": [
        {
          "name": "buyer",
          "writable": true,
          "signer": true,
          "relations": [
            "participation"
          ]
        },
        {
          "name": "groupOrder",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  114,
                  111,
                  117,
                  112,
                  95,
                  111,
                  114,
                  100,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "groupOrder.organizer",
                "account": "groupOrder"
              },
              {
                "kind": "account",
                "path": "groupOrder.goId",
                "account": "groupOrder"
              }
            ]
          },
          "relations": [
            "participation"
          ]
        },
        {
          "name": "participation",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  97,
                  114,
                  116,
                  105,
                  99,
                  105,
                  112,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "groupOrder"
              },
              {
                "kind": "account",
                "path": "buyer"
              }
            ]
          }
        },
        {
          "name": "mint",
          "relations": [
            "groupOrder"
          ]
        },
        {
          "name": "vault",
          "writable": true,
          "relations": [
            "groupOrder"
          ]
        },
        {
          "name": "buyerTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "buyer"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "closeVault",
      "discriminator": [
        141,
        103,
        17,
        126,
        72,
        75,
        29,
        29
      ],
      "accounts": [
        {
          "name": "organizer",
          "writable": true,
          "signer": true,
          "relations": [
            "groupOrder"
          ]
        },
        {
          "name": "groupOrder",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  114,
                  111,
                  117,
                  112,
                  95,
                  111,
                  114,
                  100,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "groupOrder.organizer",
                "account": "groupOrder"
              },
              {
                "kind": "account",
                "path": "groupOrder.goId",
                "account": "groupOrder"
              }
            ]
          }
        },
        {
          "name": "mint",
          "relations": [
            "groupOrder"
          ]
        },
        {
          "name": "vault",
          "writable": true,
          "relations": [
            "groupOrder"
          ]
        },
        {
          "name": "organizerTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "organizer"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "confirmReceipt",
      "discriminator": [
        203,
        36,
        80,
        115,
        249,
        12,
        141,
        170
      ],
      "accounts": [
        {
          "name": "signer",
          "docs": [
            "Buyer for confirm, anyone for release_expired (permissionless crank),",
            "arbiter for resolve."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "groupOrder",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  114,
                  111,
                  117,
                  112,
                  95,
                  111,
                  114,
                  100,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "groupOrder.organizer",
                "account": "groupOrder"
              },
              {
                "kind": "account",
                "path": "groupOrder.goId",
                "account": "groupOrder"
              }
            ]
          },
          "relations": [
            "participation"
          ]
        },
        {
          "name": "participation",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  97,
                  114,
                  116,
                  105,
                  99,
                  105,
                  112,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "groupOrder"
              },
              {
                "kind": "account",
                "path": "buyer"
              }
            ]
          }
        },
        {
          "name": "buyer",
          "writable": true,
          "relations": [
            "participation"
          ]
        },
        {
          "name": "organizer",
          "relations": [
            "groupOrder"
          ]
        },
        {
          "name": "treasury"
        },
        {
          "name": "mint",
          "relations": [
            "groupOrder"
          ]
        },
        {
          "name": "vault",
          "writable": true,
          "relations": [
            "groupOrder"
          ]
        },
        {
          "name": "buyerTokenAccount",
          "docs": [
            "The three token accounts below are marked `dup` because roles may share",
            "a wallet (an organizer who joined their own order, or a treasury that",
            "is also the organizer)."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "buyer"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "organizerTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "organizer"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "treasuryTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "treasury"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "createGroupOrder",
      "discriminator": [
        18,
        29,
        204,
        76,
        163,
        149,
        165,
        44
      ],
      "accounts": [
        {
          "name": "organizer",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "groupOrder",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  114,
                  111,
                  117,
                  112,
                  95,
                  111,
                  114,
                  100,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "organizer"
              },
              {
                "kind": "arg",
                "path": "args.goId"
              }
            ]
          }
        },
        {
          "name": "mint"
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "groupOrder"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": {
              "name": "createGroupOrderArgs"
            }
          }
        }
      ]
    },
    {
      "name": "initializeConfig",
      "discriminator": [
        208,
        127,
        21,
        1,
        194,
        190,
        196,
        70
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": {
              "name": "initializeConfigArgs"
            }
          }
        }
      ]
    },
    {
      "name": "join",
      "discriminator": [
        206,
        55,
        2,
        106,
        113,
        220,
        17,
        163
      ],
      "accounts": [
        {
          "name": "buyer",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "groupOrder",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  114,
                  111,
                  117,
                  112,
                  95,
                  111,
                  114,
                  100,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "groupOrder.organizer",
                "account": "groupOrder"
              },
              {
                "kind": "account",
                "path": "groupOrder.goId",
                "account": "groupOrder"
              }
            ]
          }
        },
        {
          "name": "participation",
          "docs": [
            "Seeds bind this account to (group_order, buyer), so a second join by the",
            "same buyer tops up the existing position instead of re-initializing it."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  97,
                  114,
                  116,
                  105,
                  99,
                  105,
                  112,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "groupOrder"
              },
              {
                "kind": "account",
                "path": "buyer"
              }
            ]
          }
        },
        {
          "name": "mint",
          "relations": [
            "groupOrder"
          ]
        },
        {
          "name": "vault",
          "writable": true,
          "relations": [
            "groupOrder"
          ]
        },
        {
          "name": "buyerTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "buyer"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "qty",
          "type": "u32"
        }
      ]
    },
    {
      "name": "leave",
      "discriminator": [
        59,
        234,
        148,
        108,
        107,
        149,
        173,
        112
      ],
      "accounts": [
        {
          "name": "buyer",
          "writable": true,
          "signer": true,
          "relations": [
            "participation"
          ]
        },
        {
          "name": "groupOrder",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  114,
                  111,
                  117,
                  112,
                  95,
                  111,
                  114,
                  100,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "groupOrder.organizer",
                "account": "groupOrder"
              },
              {
                "kind": "account",
                "path": "groupOrder.goId",
                "account": "groupOrder"
              }
            ]
          },
          "relations": [
            "participation"
          ]
        },
        {
          "name": "participation",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  97,
                  114,
                  116,
                  105,
                  99,
                  105,
                  112,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "groupOrder"
              },
              {
                "kind": "account",
                "path": "buyer"
              }
            ]
          }
        },
        {
          "name": "mint",
          "relations": [
            "groupOrder"
          ]
        },
        {
          "name": "vault",
          "writable": true,
          "relations": [
            "groupOrder"
          ]
        },
        {
          "name": "buyerTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "buyer"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "lock",
      "discriminator": [
        21,
        19,
        208,
        43,
        237,
        62,
        255,
        87
      ],
      "accounts": [
        {
          "name": "organizer",
          "writable": true,
          "signer": true,
          "relations": [
            "groupOrder"
          ]
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "groupOrder",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  114,
                  111,
                  117,
                  112,
                  95,
                  111,
                  114,
                  100,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "groupOrder.organizer",
                "account": "groupOrder"
              },
              {
                "kind": "account",
                "path": "groupOrder.goId",
                "account": "groupOrder"
              }
            ]
          }
        },
        {
          "name": "treasury"
        },
        {
          "name": "mint",
          "relations": [
            "groupOrder"
          ]
        },
        {
          "name": "vault",
          "writable": true,
          "relations": [
            "groupOrder"
          ]
        },
        {
          "name": "organizerTokenAccount",
          "docs": [
            "May be the same account as `treasury_token_account` when the organizer",
            "is also the treasury, hence `dup`."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "organizer"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "treasuryTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "treasury"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "markShipped",
      "discriminator": [
        239,
        5,
        66,
        105,
        238,
        17,
        89,
        97
      ],
      "accounts": [
        {
          "name": "organizer",
          "signer": true,
          "relations": [
            "groupOrder"
          ]
        },
        {
          "name": "groupOrder",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  114,
                  111,
                  117,
                  112,
                  95,
                  111,
                  114,
                  100,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "groupOrder.organizer",
                "account": "groupOrder"
              },
              {
                "kind": "account",
                "path": "groupOrder.goId",
                "account": "groupOrder"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "shipmentRef",
          "type": "string"
        }
      ]
    },
    {
      "name": "openDispute",
      "discriminator": [
        137,
        25,
        99,
        119,
        23,
        223,
        161,
        42
      ],
      "accounts": [
        {
          "name": "buyer",
          "signer": true,
          "relations": [
            "participation"
          ]
        },
        {
          "name": "groupOrder",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  114,
                  111,
                  117,
                  112,
                  95,
                  111,
                  114,
                  100,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "groupOrder.organizer",
                "account": "groupOrder"
              },
              {
                "kind": "account",
                "path": "groupOrder.goId",
                "account": "groupOrder"
              }
            ]
          },
          "relations": [
            "participation"
          ]
        },
        {
          "name": "participation",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  97,
                  114,
                  116,
                  105,
                  99,
                  105,
                  112,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "groupOrder"
              },
              {
                "kind": "account",
                "path": "buyer"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "releaseExpired",
      "discriminator": [
        150,
        199,
        225,
        10,
        15,
        244,
        46,
        47
      ],
      "accounts": [
        {
          "name": "signer",
          "docs": [
            "Buyer for confirm, anyone for release_expired (permissionless crank),",
            "arbiter for resolve."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "groupOrder",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  114,
                  111,
                  117,
                  112,
                  95,
                  111,
                  114,
                  100,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "groupOrder.organizer",
                "account": "groupOrder"
              },
              {
                "kind": "account",
                "path": "groupOrder.goId",
                "account": "groupOrder"
              }
            ]
          },
          "relations": [
            "participation"
          ]
        },
        {
          "name": "participation",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  97,
                  114,
                  116,
                  105,
                  99,
                  105,
                  112,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "groupOrder"
              },
              {
                "kind": "account",
                "path": "buyer"
              }
            ]
          }
        },
        {
          "name": "buyer",
          "writable": true,
          "relations": [
            "participation"
          ]
        },
        {
          "name": "organizer",
          "relations": [
            "groupOrder"
          ]
        },
        {
          "name": "treasury"
        },
        {
          "name": "mint",
          "relations": [
            "groupOrder"
          ]
        },
        {
          "name": "vault",
          "writable": true,
          "relations": [
            "groupOrder"
          ]
        },
        {
          "name": "buyerTokenAccount",
          "docs": [
            "The three token accounts below are marked `dup` because roles may share",
            "a wallet (an organizer who joined their own order, or a treasury that",
            "is also the organizer)."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "buyer"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "organizerTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "organizer"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "treasuryTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "treasury"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "resolveDispute",
      "discriminator": [
        231,
        6,
        202,
        6,
        96,
        103,
        12,
        230
      ],
      "accounts": [
        {
          "name": "signer",
          "docs": [
            "Buyer for confirm, anyone for release_expired (permissionless crank),",
            "arbiter for resolve."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "groupOrder",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  114,
                  111,
                  117,
                  112,
                  95,
                  111,
                  114,
                  100,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "groupOrder.organizer",
                "account": "groupOrder"
              },
              {
                "kind": "account",
                "path": "groupOrder.goId",
                "account": "groupOrder"
              }
            ]
          },
          "relations": [
            "participation"
          ]
        },
        {
          "name": "participation",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  97,
                  114,
                  116,
                  105,
                  99,
                  105,
                  112,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "groupOrder"
              },
              {
                "kind": "account",
                "path": "buyer"
              }
            ]
          }
        },
        {
          "name": "buyer",
          "writable": true,
          "relations": [
            "participation"
          ]
        },
        {
          "name": "organizer",
          "relations": [
            "groupOrder"
          ]
        },
        {
          "name": "treasury"
        },
        {
          "name": "mint",
          "relations": [
            "groupOrder"
          ]
        },
        {
          "name": "vault",
          "writable": true,
          "relations": [
            "groupOrder"
          ]
        },
        {
          "name": "buyerTokenAccount",
          "docs": [
            "The three token accounts below are marked `dup` because roles may share",
            "a wallet (an organizer who joined their own order, or a treasury that",
            "is also the organizer)."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "buyer"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "organizerTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "organizer"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "treasuryTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "treasury"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "refundBuyer",
          "type": "bool"
        }
      ]
    },
    {
      "name": "updateConfig",
      "discriminator": [
        29,
        158,
        252,
        191,
        10,
        83,
        219,
        99
      ],
      "accounts": [
        {
          "name": "admin",
          "signer": true,
          "relations": [
            "config"
          ]
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": {
              "name": "updateConfigArgs"
            }
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "config",
      "discriminator": [
        155,
        12,
        170,
        224,
        30,
        250,
        204,
        130
      ]
    },
    {
      "name": "groupOrder",
      "discriminator": [
        137,
        165,
        65,
        95,
        199,
        50,
        162,
        32
      ]
    },
    {
      "name": "participation",
      "discriminator": [
        237,
        154,
        142,
        46,
        143,
        63,
        189,
        18
      ]
    }
  ],
  "events": [
    {
      "name": "cancelled",
      "discriminator": [
        136,
        23,
        42,
        65,
        143,
        233,
        234,
        46
      ]
    },
    {
      "name": "completed",
      "discriminator": [
        118,
        63,
        6,
        84,
        166,
        118,
        133,
        100
      ]
    },
    {
      "name": "confirmed",
      "discriminator": [
        241,
        59,
        234,
        249,
        244,
        34,
        38,
        147
      ]
    },
    {
      "name": "disputed",
      "discriminator": [
        186,
        235,
        91,
        209,
        148,
        93,
        152,
        217
      ]
    },
    {
      "name": "groupOrderCreated",
      "discriminator": [
        243,
        2,
        55,
        178,
        20,
        217,
        44,
        197
      ]
    },
    {
      "name": "joined",
      "discriminator": [
        16,
        20,
        44,
        48,
        132,
        189,
        68,
        98
      ]
    },
    {
      "name": "left",
      "discriminator": [
        225,
        78,
        253,
        233,
        66,
        254,
        152,
        164
      ]
    },
    {
      "name": "locked",
      "discriminator": [
        188,
        53,
        118,
        62,
        64,
        12,
        198,
        84
      ]
    },
    {
      "name": "refunded",
      "discriminator": [
        35,
        103,
        149,
        246,
        196,
        123,
        221,
        99
      ]
    },
    {
      "name": "released",
      "discriminator": [
        232,
        229,
        255,
        136,
        101,
        189,
        15,
        220
      ]
    },
    {
      "name": "resolved",
      "discriminator": [
        148,
        46,
        187,
        66,
        35,
        1,
        255,
        147
      ]
    },
    {
      "name": "shipped",
      "discriminator": [
        11,
        112,
        50,
        100,
        71,
        202,
        131,
        14
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "paused",
      "msg": "Protocol is paused"
    },
    {
      "code": 6001,
      "name": "invalidStatus",
      "msg": "Action not allowed in the current status"
    },
    {
      "code": 6002,
      "name": "deadlinePassed",
      "msg": "Join deadline has passed"
    },
    {
      "code": 6003,
      "name": "deadlineNotReached",
      "msg": "Join deadline has not been reached"
    },
    {
      "code": 6004,
      "name": "minimumNotMet",
      "msg": "Minimum quantity not met"
    },
    {
      "code": 6005,
      "name": "minimumAlreadyMet",
      "msg": "Minimum quantity already met; cancel requires the organizer"
    },
    {
      "code": 6006,
      "name": "maxQuantityExceeded",
      "msg": "Join would exceed the maximum quantity"
    },
    {
      "code": 6007,
      "name": "invalidQuantity",
      "msg": "Quantity must be at least 1 and min must not exceed max"
    },
    {
      "code": 6008,
      "name": "invalidPrice",
      "msg": "Unit price must be greater than zero"
    },
    {
      "code": 6009,
      "name": "invalidAdvance",
      "msg": "Advance exceeds the allowed maximum"
    },
    {
      "code": 6010,
      "name": "invalidFee",
      "msg": "Fee exceeds the allowed maximum"
    },
    {
      "code": 6011,
      "name": "invalidWindow",
      "msg": "Deadline or window out of bounds"
    },
    {
      "code": 6012,
      "name": "titleTooLong",
      "msg": "Title too long"
    },
    {
      "code": 6013,
      "name": "descriptionTooLong",
      "msg": "Description too long"
    },
    {
      "code": 6014,
      "name": "uriTooLong",
      "msg": "URI too long"
    },
    {
      "code": 6015,
      "name": "refTooLong",
      "msg": "Shipment reference too long"
    },
    {
      "code": 6016,
      "name": "unauthorized",
      "msg": "Signer is not authorized for this action"
    },
    {
      "code": 6017,
      "name": "alreadyConfirmed",
      "msg": "Receipt already confirmed"
    },
    {
      "code": 6018,
      "name": "alreadyDisputed",
      "msg": "Participation already in dispute"
    },
    {
      "code": 6019,
      "name": "inDispute",
      "msg": "Participation is in dispute; wait for the arbiter"
    },
    {
      "code": 6020,
      "name": "notDisputed",
      "msg": "Participation is not in dispute"
    },
    {
      "code": 6021,
      "name": "windowNotExpired",
      "msg": "Time window has not expired yet"
    },
    {
      "code": 6022,
      "name": "windowExpired",
      "msg": "Time window has expired"
    },
    {
      "code": 6023,
      "name": "mathOverflow",
      "msg": "Arithmetic overflow"
    },
    {
      "code": 6024,
      "name": "mintMismatch",
      "msg": "Token account mint does not match the group order mint"
    },
    {
      "code": 6025,
      "name": "vaultNotEmpty",
      "msg": "Vault still holds participant funds"
    },
    {
      "code": 6026,
      "name": "mintNotAllowed",
      "msg": "Mint is not allowed by protocol config"
    },
    {
      "code": 6027,
      "name": "arbiterIsOrganizer",
      "msg": "Organizer cannot be the arbiter of their own order"
    },
    {
      "code": 6028,
      "name": "committed",
      "msg": "Cannot leave after the deadline once the minimum is met"
    },
    {
      "code": 6029,
      "name": "windDown",
      "msg": "Cannot ship after buyers have started reclaiming funds"
    }
  ],
  "types": [
    {
      "name": "cancelled",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "groupOrder",
            "type": "pubkey"
          },
          {
            "name": "by",
            "type": "pubkey"
          },
          {
            "name": "ts",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "completed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "groupOrder",
            "type": "pubkey"
          },
          {
            "name": "status",
            "type": "u8"
          },
          {
            "name": "ts",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "config",
      "docs": [
        "Singleton protocol configuration."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "pubkey"
          },
          {
            "name": "treasury",
            "type": "pubkey"
          },
          {
            "name": "defaultArbiter",
            "type": "pubkey"
          },
          {
            "name": "allowedMint",
            "docs": [
              "Only this mint may be used for new group orders. `Pubkey::default()`",
              "disables the allowlist. Prevents transfer-fee or confidential mints",
              "from breaking vault accounting."
            ],
            "type": "pubkey"
          },
          {
            "name": "feeBps",
            "type": "u16"
          },
          {
            "name": "maxAdvanceBps",
            "type": "u16"
          },
          {
            "name": "paused",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "confirmed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "groupOrder",
            "type": "pubkey"
          },
          {
            "name": "buyer",
            "type": "pubkey"
          },
          {
            "name": "released",
            "type": "u64"
          },
          {
            "name": "fee",
            "type": "u64"
          },
          {
            "name": "ts",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "createGroupOrderArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "goId",
            "type": "u64"
          },
          {
            "name": "title",
            "type": "string"
          },
          {
            "name": "description",
            "type": "string"
          },
          {
            "name": "detailsUri",
            "type": "string"
          },
          {
            "name": "imageUri",
            "type": "string"
          },
          {
            "name": "unitPrice",
            "type": "u64"
          },
          {
            "name": "minQty",
            "type": "u32"
          },
          {
            "name": "maxQty",
            "type": "u32"
          },
          {
            "name": "advanceBps",
            "type": "u16"
          },
          {
            "name": "joinDeadline",
            "type": "i64"
          },
          {
            "name": "shipBySecs",
            "type": "i64"
          },
          {
            "name": "deliveryWindowSecs",
            "type": "i64"
          },
          {
            "name": "arbiter",
            "docs": [
              "None uses the protocol default arbiter."
            ],
            "type": {
              "option": "pubkey"
            }
          }
        ]
      }
    },
    {
      "name": "disputed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "groupOrder",
            "type": "pubkey"
          },
          {
            "name": "buyer",
            "type": "pubkey"
          },
          {
            "name": "ts",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "goStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "open"
          },
          {
            "name": "locked"
          },
          {
            "name": "shipped"
          },
          {
            "name": "completed"
          },
          {
            "name": "cancelled"
          },
          {
            "name": "expired"
          }
        ]
      }
    },
    {
      "name": "groupOrder",
      "docs": [
        "One escrowed group order."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "organizer",
            "type": "pubkey"
          },
          {
            "name": "goId",
            "type": "u64"
          },
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "arbiter",
            "type": "pubkey"
          },
          {
            "name": "title",
            "type": "string"
          },
          {
            "name": "description",
            "type": "string"
          },
          {
            "name": "detailsUri",
            "docs": [
              "Link to the organizer's GO post (X, Instagram, Discord) with full details."
            ],
            "type": "string"
          },
          {
            "name": "imageUri",
            "docs": [
              "Cover image for the order."
            ],
            "type": "string"
          },
          {
            "name": "unitPrice",
            "type": "u64"
          },
          {
            "name": "minQty",
            "type": "u32"
          },
          {
            "name": "maxQty",
            "type": "u32"
          },
          {
            "name": "feeBps",
            "docs": [
              "Snapshot of the protocol fee at creation so admin changes never",
              "affect a running order."
            ],
            "type": "u16"
          },
          {
            "name": "advanceBps",
            "type": "u16"
          },
          {
            "name": "joinDeadline",
            "type": "i64"
          },
          {
            "name": "shipBySecs",
            "type": "i64"
          },
          {
            "name": "deliveryWindowSecs",
            "type": "i64"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "goStatus"
              }
            }
          },
          {
            "name": "totalQty",
            "type": "u32"
          },
          {
            "name": "totalPaid",
            "type": "u64"
          },
          {
            "name": "participants",
            "type": "u32"
          },
          {
            "name": "settled",
            "type": "u32"
          },
          {
            "name": "advancePaid",
            "type": "u64"
          },
          {
            "name": "disputesOpened",
            "type": "u32"
          },
          {
            "name": "disputesLost",
            "type": "u32"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "lockedAt",
            "type": "i64"
          },
          {
            "name": "shippedAt",
            "type": "i64"
          },
          {
            "name": "shipmentRef",
            "type": "string"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "groupOrderCreated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "groupOrder",
            "type": "pubkey"
          },
          {
            "name": "organizer",
            "type": "pubkey"
          },
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "unitPrice",
            "type": "u64"
          },
          {
            "name": "minQty",
            "type": "u32"
          },
          {
            "name": "maxQty",
            "type": "u32"
          },
          {
            "name": "joinDeadline",
            "type": "i64"
          },
          {
            "name": "ts",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "initializeConfigArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "allowedMint",
            "type": "pubkey"
          },
          {
            "name": "feeBps",
            "type": "u16"
          },
          {
            "name": "maxAdvanceBps",
            "type": "u16"
          },
          {
            "name": "treasury",
            "type": "pubkey"
          },
          {
            "name": "defaultArbiter",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "joined",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "groupOrder",
            "type": "pubkey"
          },
          {
            "name": "buyer",
            "type": "pubkey"
          },
          {
            "name": "qty",
            "type": "u32"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "ts",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "left",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "groupOrder",
            "type": "pubkey"
          },
          {
            "name": "buyer",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "ts",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "locked",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "groupOrder",
            "type": "pubkey"
          },
          {
            "name": "totalQty",
            "type": "u32"
          },
          {
            "name": "totalPaid",
            "type": "u64"
          },
          {
            "name": "advancePaid",
            "type": "u64"
          },
          {
            "name": "ts",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "participation",
      "docs": [
        "One buyer's position in a group order. Closed when it reaches a",
        "terminal state so the buyer recovers rent."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "groupOrder",
            "type": "pubkey"
          },
          {
            "name": "buyer",
            "type": "pubkey"
          },
          {
            "name": "qty",
            "type": "u32"
          },
          {
            "name": "paid",
            "type": "u64"
          },
          {
            "name": "confirmed",
            "type": "bool"
          },
          {
            "name": "disputed",
            "type": "bool"
          },
          {
            "name": "joinedAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "refunded",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "groupOrder",
            "type": "pubkey"
          },
          {
            "name": "buyer",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "ts",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "released",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "groupOrder",
            "type": "pubkey"
          },
          {
            "name": "buyer",
            "type": "pubkey"
          },
          {
            "name": "released",
            "type": "u64"
          },
          {
            "name": "fee",
            "type": "u64"
          },
          {
            "name": "ts",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "resolved",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "groupOrder",
            "type": "pubkey"
          },
          {
            "name": "buyer",
            "type": "pubkey"
          },
          {
            "name": "refundedBuyer",
            "type": "bool"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "ts",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "shipped",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "groupOrder",
            "type": "pubkey"
          },
          {
            "name": "shipmentRef",
            "type": "string"
          },
          {
            "name": "ts",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "updateConfigArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "allowedMint",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "feeBps",
            "type": {
              "option": "u16"
            }
          },
          {
            "name": "maxAdvanceBps",
            "type": {
              "option": "u16"
            }
          },
          {
            "name": "treasury",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "defaultArbiter",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "paused",
            "type": {
              "option": "bool"
            }
          },
          {
            "name": "newAdmin",
            "type": {
              "option": "pubkey"
            }
          }
        ]
      }
    }
  ]
};
