import React, { useEffect, useState } from 'react';

const TransactionList = () => {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const fetchTransactions = async () => {
      const res = await fetch('http://localhost:5000/api/transactions?user_id=1&month=2025-05');
      const data = await res.json();
      setTransactions(data);
    };

    fetchTransactions();
  }, []);

  return (
    <div>
      <h2>2025년 5월 거래 내역</h2>
      <ul>
        {transactions.map(tx => (
          <li key={tx.id}>
            [{tx.transaction_date}] {tx.type === 'income' ? '+' : '-'}{tx.amount}원 ({tx.category}) - {tx.memo}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TransactionList;
