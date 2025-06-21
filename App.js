import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "./components/CardComponents";
import { Input } from "./components/Input";
import { Button } from "./components/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "./components/TableComponents";
import { Trash2 } from "./components/Trash2";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Label,
  Cell
} from "recharts";

import {
  detectAnomaly,
  processTransactionsWithThreshold,
  initialMockData,
  INITIAL_GLOBAL_THRESHOLD,
  formatTimestamp
} from "./utils/transactions";

export default function App() {
  const [anomalyThreshold, setAnomalyThreshold] = useState(INITIAL_GLOBAL_THRESHOLD);
  const [thresholdInput, setThresholdInput] = useState(INITIAL_GLOBAL_THRESHOLD.toString());

  const [transactions, setTransactions] = useState(() =>
    processTransactionsWithThreshold(initialMockData, INITIAL_GLOBAL_THRESHOLD)
  );
  const [newTxAmountInput, setNewTxAmountInput] = useState("");

  useEffect(() => {
    const numValue = parseFloat(thresholdInput);
    if (!isNaN(numValue) && numValue > 0) {
      setAnomalyThreshold(numValue);
    }
  }, [thresholdInput]);

  useEffect(() => {
    setTransactions((prevTransactions) =>
      processTransactionsWithThreshold(prevTransactions, anomalyThreshold)
    );
  }, [anomalyThreshold]);

  // Handles adding a new transaction
  const handleAddTransaction = () => {
    const parsedAmount = parseFloat(newTxAmountInput);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      console.error("Invalid transaction amount");
      return;
    }

    const isFlagged = detectAnomaly(parsedAmount, anomalyThreshold);
    const newId = transactions.length > 0 ? Math.max(...transactions.map((t) => t.id)) + 1 : 1;

    const newTx = {
      id: newId,
      amount: parsedAmount,
      flagged: isFlagged,
      timestamp: new Date().toISOString()
    };

    setTransactions((prevTransactions) => [...prevTransactions, newTx]);
    setNewTxAmountInput("");
  };

  // Handles deleting a transaction
  const handleDeleteTransaction = (transactionId) => {
    setTransactions((prevTransactions) =>
      prevTransactions.filter((tx) => tx.id !== transactionId)
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 bg-gray-50 min-h-screen font-sans">
      <header className="text-center py-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">Smart AML Detection System</h1>
        <p className="text-gray-600 mt-1">Monitor and manage financial transactions for anomalies.</p>
      </header>

      {/* Settings and Add Transaction Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Detection Settings</CardTitle>
            <CardDescription>Adjust the threshold for flagging transactions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label htmlFor="thresholdInput" className="block text-sm font-medium text-gray-700 mb-1">
                Anomaly Detection Threshold ($)
              </label>
              <Input
                id="thresholdInput"
                type="number"
                placeholder="e.g., 10000"
                value={thresholdInput}
                onChange={(e) => setThresholdInput(e.target.value)}
                className="w-full"
              />
            </div>
            <p className="text-xs text-gray-600">
              Currently, transactions over ${anomalyThreshold.toLocaleString()} are flagged.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add New Transaction</CardTitle>
            <CardDescription>Enter amount to add a new transaction.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              type="number"
              placeholder="Transaction Amount"
              value={newTxAmountInput}
              onChange={(e) => setNewTxAmountInput(e.target.value)}
              className="w-full"
            />
            <Button onClick={handleAddTransaction} className="w-full">
              Add Transaction
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Transactions ({transactions.length})</CardTitle>
          <CardDescription>List of all recorded transactions.</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Amount ($)</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions
                    .slice()
                    .sort((a, b) => b.id - a.id)
                    .map((tx) => (
                      <TableRow key={tx.id} className={tx.flagged ? "bg-red-50" : ""}>
                        <TableCell className="font-medium">{tx.id}</TableCell>
                        <TableCell>{tx.amount.toLocaleString()}</TableCell>
                        <TableCell>{formatTimestamp(tx.timestamp)}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              tx.flagged
                                ? "bg-red-200 text-red-800"
                                : "bg-green-200 text-green-800"
                            }`}
                          >
                            {tx.flagged ? "Flagged" : "Clear"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            onClick={() => handleDeleteTransaction(tx.id)}
                            variant="destructive"
                            className="p-1.5 text-xs"
                          >
                            <Trash2 /> <span className="ml-1 hidden sm:inline">Delete</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-gray-600 text-center py-4">No transactions recorded yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Overview Chart</CardTitle>
          <CardDescription>Visual representation of transaction amounts.</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={transactions}
                margin={{ top: 5, right: 20, left: 30, bottom: 20 }}
              >
                <XAxis dataKey="id" name="Transaction ID">
                  <Label value="Transaction ID" position="insideBottom" offset={-15} />
                </XAxis>
                <YAxis
                  tickFormatter={(value) =>
                    `$${value >= 1000 ? `${value / 1000}k` : value}`
                  }
                >
                  <Label
                    value="Amount ($)"
                    angle={-90}
                    position="insideLeft"
                    style={{ textAnchor: "middle" }}
                  />
                </YAxis>
                <Tooltip
                  formatter={(value, name, props) => [
                    `$${value.toLocaleString()}`,
                    `Amount (ID: ${props.payload.id})`
                  ]}
                  labelFormatter={(label) => `Transaction ID: ${label}`}
                />
                <Bar dataKey="amount" name="Transaction Amount">
                  {transactions.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.flagged ? "#EF4444" : "#3B82F6"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-600 text-center py-4">
              No data to display in chart.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Flagged Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Flagged Transactions ({transactions.filter((tx) => tx.flagged).length})
          </CardTitle>
          <CardDescription>
            Transactions exceeding the set anomaly threshold.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.filter((tx) => tx.flagged).length > 0 ? (
            <ul className="space-y-2">
              {transactions
                .filter((tx) => tx.flagged)
                .slice()
                .sort((a, b) => b.id - a.id)
                .map((tx) => (
                  <li
                    key={tx.id}
                    className="p-3 bg-red-100 border border-red-300 rounded-md text-sm text-red-700"
                  >
                    ID: <span className="font-semibold">{tx.id}</span> - Amount:{" "}
                    <span className="font-semibold">
                      ${tx.amount.toLocaleString()}
                    </span>
                    <span className="text-xs block text-red-600">
                      (Exceeds threshold of ${anomalyThreshold.toLocaleString()})
                    </span>
                    <span className="text-xs block text-gray-500">
                      Timestamp: {formatTimestamp(tx.timestamp)}
                    </span>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="text-gray-600">
              No transactions are currently flagged based on the threshold of $
              {anomalyThreshold.toLocaleString()}.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}