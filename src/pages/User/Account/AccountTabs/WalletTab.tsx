import { Plus, Wallet as WalletIcon } from "lucide-react";

import { formatCurrency } from "@/lib/formatting";

interface WalletTabProps {
  balance: number;
  isTopUpLoading: boolean;
  topUpAmount: string;
  minTopUp: number;
  maxTopUp: number;
  step: number;
  presetAmounts: number[];
  onTopUpAmountChange: (_value: string) => void;
  onTopUp: (_amount: number) => void;
}

export function WalletTab({
  balance,
  isTopUpLoading,
  topUpAmount,
  minTopUp,
  maxTopUp,
  step,
  presetAmounts,
  onTopUpAmountChange,
  onTopUp,
}: WalletTabProps) {
  const amountValue = Number(topUpAmount || 0);
  const isAmountValid =
    Number.isFinite(amountValue) &&
    amountValue >= minTopUp &&
    amountValue <= maxTopUp &&
    amountValue % step === 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl bg-linear-to-r from-[#0047AB] to-[#007BFF] p-8 text-white shadow-lg">
        <div className="mb-4 flex items-center gap-3">
          <WalletIcon className="h-8 w-8" />
          <span className="font-['Inter'] text-lg font-medium">Ví INBLUE</span>
        </div>
        <div className="mb-6">
          <p className="font-['Inter'] text-sm font-normal opacity-80">Số dư hiện tại</p>
          <p className="font-['Poppins'] text-4xl font-bold">{formatCurrency(balance)}</p>
        </div>

        <div className="space-y-3 rounded-xl bg-white/10 p-4 backdrop-blur-sm">
          <p className="font-['Inter'] text-sm font-medium">Nạp tiền vào ví</p>

          <div className="flex flex-wrap gap-2">
            {presetAmounts.map((preset) => (
              <button
                key={preset}
                onClick={() => onTopUpAmountChange(String(preset))}
                disabled={isTopUpLoading}
                className={`rounded-lg px-3 py-1.5 font-['Inter'] text-xs font-medium transition-colors ${
                  Number(topUpAmount) === preset
                    ? "bg-white text-[#0047AB]"
                    : "bg-white/20 text-white hover:bg-white/30"
                } disabled:cursor-not-allowed disabled:opacity-60`}>
                {preset.toLocaleString("vi-VN")}đ
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="text"
              inputMode="numeric"
              value={topUpAmount}
              onChange={(event) => onTopUpAmountChange(event.target.value)}
              placeholder="Nhập số tiền muốn nạp"
              className="h-11 flex-1 rounded-lg border border-white/30 bg-white/15 px-3 font-['Inter'] text-sm text-white placeholder:text-white/60 focus:border-white focus:outline-hidden"
            />
            <button
              onClick={() => onTopUp(amountValue)}
              disabled={!isAmountValid || isTopUpLoading}
              className="flex h-11 items-center justify-center gap-2 rounded-lg bg-white px-4 font-['Inter'] text-sm font-semibold text-[#0047AB] transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60">
              <Plus className="h-4 w-4" />
              {isTopUpLoading ? "Đang tạo link..." : "Nạp tiền"}
            </button>
          </div>

          <p className="font-['Inter'] text-xs text-white/80">
            Số tiền hợp lệ: {minTopUp.toLocaleString("vi-VN")}đ - {maxTopUp.toLocaleString("vi-VN")}
            đ, bước nhảy {step.toLocaleString("vi-VN")}đ.
          </p>
        </div>
      </div>
    </div>
  );
}
