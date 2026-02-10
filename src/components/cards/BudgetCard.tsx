import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface BudgetCardProps {
  title: string;
  amount: number;
  spent: number;
  category?: string;
  color?: string;
}

export const BudgetCard: React.FC<BudgetCardProps> = ({
  title,
  amount,
  spent,
  category: _category,
  color = '#F87060'
}) => {
  const percentage = amount > 0 ? (spent / amount) * 100 : 0;
  const isOverBudget = percentage > 100;

  return (
    <Card className="budget-card">
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Gasto: R$ {spent.toFixed(2)}</span>
            <span>Orçado: R$ {amount.toFixed(2)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${isOverBudget ? 'bg-red-500' : 'bg-green-500'}`}
              style={{
                width: `${Math.min(percentage, 100)}%`,
                backgroundColor: isOverBudget ? '#ef4444' : color
              }}
            />
          </div>
          <div className="text-xs text-gray-600">
            {percentage.toFixed(1)}% do orçamento
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BudgetCard;