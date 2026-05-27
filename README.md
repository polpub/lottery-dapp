# Lottery dApp - MultiversX

O aplicatie de loterie decentralizata construita pe blockchain-ul MultiversX.

## Descriere

Utilizatorii pot cumpara bilete in EGLD in timpul perioadei active. La expirarea loteriei, proprietarul contractului trage la sorti un castigator care primeste intregul pool de premii.

## Platform

MultiversX (Devnet)

## Contract Address

erd1qqqqqqqqqqqqqpgqy2h0d3a8r6s5nztpcvxhgw5l4845y5t48wgqyxk988

## Cum rulezi frontend-ul local

```bash
cd frontend
npm install
npm run dev
```

Deschide http://localhost:5173 in browser.

## Endpoint-uri contract

| Endpoint | Tip | Descriere |
|----------|-----|-----------|
| startLottery(ticket_price, duration_seconds) | Owner | Porneste o runda noua |
| buyTicket | Payable | Cumpara un bilet (trimite exact pretul) |
| drawWinner | Owner | Trage la sorti castigatorul dupa expirare |
| resetLottery | Owner | Reseteaza pentru o noua runda |
| getStatus | View | Returneaza statusul (0=Inactive, 1=Active, 2=Ended) |
| getTicketPrice | View | Returneaza pretul unui bilet in wei |
| getPrizePool | View | Returneaza pool-ul de premii in wei |
| getDeadline | View | Returneaza timestamp-ul de expirare |
| getParticipantCount | View | Returneaza numarul de participanti |
| getWinner | View | Returneaza adresa castigatorului |
