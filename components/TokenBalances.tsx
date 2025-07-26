import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';

const RPC_URL = 'https://api.mainnet-beta.solana.com';

function TokenBalancesContent() {
  const { publicKey } = useWallet();
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [tokens, setTokens] = useState<{mint: string, symbol: string, uiAmount: number}[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchBalances() {
      if (!publicKey) return;
      setLoading(true);
      const connection = new Connection(RPC_URL);
      // SOL balance
      const sol = await connection.getBalance(publicKey) / 1e9;
      setSolBalance(sol);

      // SPL token balances
      const tokensRaw = await connection.getParsedTokenAccountsByOwner(publicKey, {
        programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
      });
      const list = tokensRaw.value.map(({account}) => {
        const mint = account.data.parsed.info.mint;
        const uiAmount = account.data.parsed.info.tokenAmount.uiAmount || 0;
        let symbol = mint === "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" ? "USDC"
          : mint === "DezXAZ8z7PnrnRJjz3wXBoRhwTLdMPkqhuBczetogeoK" ? "BONK"
          : mint === "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBtUk6goG7zcX3New" ? "WIF"
          : mint === "So11111111111111111111111111111111111111112" ? "SOL"
          : mint.slice(0,4)+"..."+mint.slice(-4);
        return { mint, symbol, uiAmount };
      });
      setTokens(list.filter(t=>t.uiAmount > 0));
      setLoading(false);
    }
    fetchBalances();
  }, [publicKey]);

  if (!publicKey) return null;
  return (
    <div className="balances-list">
      <div><b>SOL Balance:</b> {solBalance === null ? <span className="spinner"/> : solBalance}</div>
      <div><b>Token Balances:</b>
        {loading ? <span className="spinner"/> : (
          tokens.length === 0 ? <div>No tokens found</div> : (
            <ul>
              {tokens.map(t => <li key={t.mint}>{t.symbol}: {t.uiAmount}</li>)}
            </ul>
          )
        )}
      </div>
    </div>
  );
}

export default function TokenBalances() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <TokenBalancesContent />;
}
