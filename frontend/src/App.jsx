import React, { useState, useEffect } from 'react'

const CONTRACT = 'erd1qqqqqqqqqqqqqpgqy2h0d3a8r6s5nztpcvxhgw5l4845y5t48wgqyxk988'
const API = 'https://devnet-api.multiversx.com'
const EXPLORER = 'https://devnet-explorer.multiversx.com'
const STATUS_MAP = { 0: 'Inactive', 1: 'Active', 2: 'Ended' }

async function queryView(func) {
  const res = await fetch(`${API}/vm-values/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scAddress: CONTRACT, funcName: func, args: [] })
  })
  const json = await res.json()
  return json.data?.data?.returnData || []
}

function hexFromB64(b64) {
  if (!b64) return '0'
  return atob(b64).split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
}

function egldFromHex(hex) {
  if (!hex || hex === '0') return '0'
  const val = BigInt('0x' + hex)
  return (Number(val) / 1e18).toFixed(4)
}

function intFromHex(hex) {
  if (!hex || hex === '0') return 0
  return parseInt(hex, 16)
}

export default function App() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [inputAddress, setInputAddress] = useState('')

  async function loadData() {
    setLoading(true)
    try {
      const [s, p, pr, c, d] = await Promise.all([
        queryView('getStatus'),
        queryView('getPrizePool'),
        queryView('getTicketPrice'),
        queryView('getParticipantCount'),
        queryView('getDeadline'),
      ])
      const deadlineTs = intFromHex(hexFromB64(d[0]))
      setData({
        status: intFromHex(hexFromB64(s[0])),
        prizePool: egldFromHex(hexFromB64(p[0])),
        ticketPrice: egldFromHex(hexFromB64(pr[0])),
        ticketPriceHex: hexFromB64(pr[0]),
        participantCount: intFromHex(hexFromB64(c[0])),
        deadline: deadlineTs > 0 ? new Date(deadlineTs * 1000).toLocaleString() : 'N/A',
      })
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  function buyTicket() {
    if (!inputAddress) { alert('Introdu adresa ta erd1...'); return }
    const priceWei = data ? BigInt('0x' + (data.ticketPriceHex || '0')) : 0n
    const url = `https://devnet-wallet.multiversx.com/hook/transaction?receiver=${CONTRACT}&value=${priceWei}&gasLimit=10000000&data=buyTicket&callbackUrl=${encodeURIComponent(window.location.href)}`
    window.open(url, '_blank')
  }

  return (
    <div style={{fontFamily:'Arial,sans-serif',maxWidth:600,margin:'40px auto',padding:20}}>
      <h1 style={{textAlign:'center',color:'#1a1a2e'}}>Loterie Descentralizata</h1>
      <p style={{textAlign:'center',fontSize:12,color:'#888'}}>
        Contract: <a href={`${EXPLORER}/accounts/${CONTRACT}`} target="_blank">{CONTRACT.slice(0,20)}...</a>
      </p>
      {loading ? <p style={{textAlign:'center'}}>Se incarca...</p> : data ? (
        <div style={{background:'#f5f5f5',borderRadius:12,padding:24,marginBottom:24}}>
          <h2 style={{marginTop:0}}>Status Loterie</h2>
          <p>Status: <strong>{STATUS_MAP[data.status] ?? 'Necunoscut'}</strong></p>
          <p>Pool de premii: <strong>{data.prizePool} EGLD</strong></p>
          <p>Pret bilet: <strong>{data.ticketPrice} EGLD</strong></p>
          <p>Participanti: <strong>{data.participantCount}</strong></p>
          <p>Deadline: <strong>{data.deadline}</strong></p>
          <button onClick={loadData} style={{padding:'8px 16px',cursor:'pointer'}}>Reincarca</button>
        </div>
      ) : <p style={{color:'red',textAlign:'center'}}>Eroare la incarcare.</p>}
      <div style={{background:'#e8f4fd',borderRadius:12,padding:24}}>
        <h2 style={{marginTop:0}}>Cumpara Bilet</h2>
        <input type="text" placeholder="Adresa ta erd1..." value={inputAddress}
          onChange={e=>setInputAddress(e.target.value)}
          style={{width:'100%',padding:10,marginBottom:12,borderRadius:6,border:'1px solid #ccc',boxSizing:'border-box'}}
        />
        <button onClick={buyTicket} disabled={!data||data.status!==1}
          style={{width:'100%',padding:12,background:data?.status===1?'#4CAF50':'#ccc',
          color:'white',border:'none',borderRadius:6,fontSize:16,
          cursor:data?.status===1?'pointer':'not-allowed'}}>
          {data?.status===1 ? `Cumpara Bilet (${data.ticketPrice} EGLD)` : 'Loteria nu este activa'}
        </button>
      </div>
    </div>
  )
}
