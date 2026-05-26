#![no_std]

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

#[derive(TypeAbi, TopEncode, TopDecode, PartialEq, Clone, Copy)]
pub enum LotteryStatus {
    Inactive,
    Active,
    Ended,
}

#[multiversx_sc::contract]
pub trait Lottery {
    #[init]
    fn init(&self) {}

    // Owner porneste loteria
    #[only_owner]
    #[endpoint(startLottery)]
    fn start_lottery(
        &self,
        ticket_price: BigUint,
        duration_seconds: u64,
    ) {
        require!(
            self.status().get() == LotteryStatus::Inactive,
            "Lottery already active"
        );
        require!(ticket_price > 0, "Ticket price must be > 0");
        require!(duration_seconds > 0, "Duration must be > 0");

        let deadline = self.blockchain().get_block_timestamp() + duration_seconds;
        self.ticket_price().set(&ticket_price);
        self.deadline().set(deadline);
        self.status().set(LotteryStatus::Active);
        self.prize_pool().set(&BigUint::zero());
    }

    // Utilizatorul cumpara un bilet
    #[payable("EGLD")]
    #[endpoint(buyTicket)]
    fn buy_ticket(&self) {
        require!(
            self.status().get() == LotteryStatus::Active,
            "Lottery is not active"
        );
        require!(
            self.blockchain().get_block_timestamp() < self.deadline().get(),
            "Lottery has ended"
        );

        let payment = self.call_value().egld_value().clone_value();
        let price = self.ticket_price().get();
        require!(payment == price, "Wrong ticket price");

        let caller = self.blockchain().get_caller();
        self.participants().push(&caller);

        let new_pool = self.prize_pool().get() + payment;
        self.prize_pool().set(&new_pool);
    }

    // Owner trage la sorti castigatorul
    #[only_owner]
    #[endpoint(drawWinner)]
    fn draw_winner(&self) {
        require!(
            self.status().get() == LotteryStatus::Active,
            "Lottery is not active"
        );
        require!(
            self.blockchain().get_block_timestamp() >= self.deadline().get(),
            "Lottery not ended yet"
        );

        let count = self.participants().len();
        require!(count > 0, "No participants");

        let rand_index = self.get_random_index(count);
        let winner = self.participants().get(rand_index);
        let pool = self.prize_pool().get();

        self.send().direct_egld(&winner, &pool);
        self.winner().set(&winner);
        self.status().set(LotteryStatus::Ended);
        self.prize_pool().set(&BigUint::zero());
    }

    // Reset pentru o noua runda
    #[only_owner]
    #[endpoint(resetLottery)]
    fn reset_lottery(&self) {
        require!(
            self.status().get() == LotteryStatus::Ended,
            "Lottery not ended yet"
        );
        self.participants().clear();
        self.status().set(LotteryStatus::Inactive);
    }

    // Randomness pe baza seed-ului de bloc
    fn get_random_index(&self, count: usize) -> usize {
        let seed = self.blockchain().get_block_random_seed();
        let seed_bytes = seed.to_byte_array();
        let mut value: u64 = 0;
        for i in 0..8 {
            value = (value << 8) | (seed_bytes[i] as u64);
        }
        (value as usize) % count
    }

    // View-uri (citire date din contract)
    #[view(getStatus)]
    fn get_status(&self) -> LotteryStatus {
        self.status().get()
    }

    #[view(getTicketPrice)]
    fn get_ticket_price(&self) -> BigUint {
        self.ticket_price().get()
    }

    #[view(getPrizePool)]
    fn get_prize_pool(&self) -> BigUint {
        self.prize_pool().get()
    }

    #[view(getDeadline)]
    fn get_deadline(&self) -> u64 {
        self.deadline().get()
    }

    #[view(getParticipantCount)]
    fn get_participant_count(&self) -> usize {
        self.participants().len()
    }

    #[view(getWinner)]
    fn get_winner(&self) -> ManagedAddress {
        self.winner().get()
    }

    // Storage
    #[storage_mapper("status")]
    fn status(&self) -> SingleValueMapper<LotteryStatus>;

    #[storage_mapper("ticket_price")]
    fn ticket_price(&self) -> SingleValueMapper<BigUint>;

    #[storage_mapper("deadline")]
    fn deadline(&self) -> SingleValueMapper<u64>;

    #[storage_mapper("prize_pool")]
    fn prize_pool(&self) -> SingleValueMapper<BigUint>;

    #[storage_mapper("participants")]
    fn participants(&self) -> VecMapper<ManagedAddress>;

    #[storage_mapper("winner")]
    fn winner(&self) -> SingleValueMapper<ManagedAddress>;
}
