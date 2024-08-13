use anchor_lang::prelude::*;

#[account]
#[derive(Debug)]
pub struct AirdropInfo {
    pub has_received: bool,
}
