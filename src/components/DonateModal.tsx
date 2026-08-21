import React, { useState } from 'react';
import { 
  Heart, 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  Coffee, 
  CreditCard, 
  QrCode,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { adminService } from '../services/adminService';
import { alertSuccess } from '../utils/swal';
import { getPromptPayQrImages } from '../utils/promptpay';

interface DonateModalProps {
  onClose: () => void;
}

export const DonateModal: React.FC<DonateModalProps> = ({ onClose }) => {
  const donationConfig = adminService.getDonationConfig();
  const [activeChannel, setActiveChannel] = useState<'promptpay' | 'coffee' | 'stripe'>('promptpay');
  const [copied, setCopied] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);

  // PromptPay Preset Amount state
  const [selectedPromptPayAmount, setSelectedPromptPayAmount] = useState<number | null>(100);

  // Buy Me a Coffee Cup selection
  const [coffeeCups, setCoffeeCups] = useState<number>(3);
  const coffeeUnitPrice = donationConfig.buyMeACoffeeDefaultCoffeePrice || 3;

  // Stripe selected tier
  const [stripeAmount, setStripeAmount] = useState<number>(10);

  const { emvPayload, qrUrl, backupQrUrl } = getPromptPayQrImages(
    donationConfig.promptPayNumber,
    selectedPromptPayAmount
  );

  const handleCopyPromptPay = () => {
    navigator.clipboard.writeText(donationConfig.promptPayNumber.replace(/-/g, ''));
    setCopied(true);
    alertSuccess('คัดลอกเบอร์พร้อมเพย์แล้ว', donationConfig.promptPayNumber);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(emvPayload);
    setCopiedPayload(true);
    alertSuccess('คัดลอกรหัส EMVCo Payload สำเร็จ', 'นำรหัสไปใช้ในระบบชำระเงินหรือ QR Scanner ได้ทันที');
    setTimeout(() => setCopiedPayload(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 selection:bg-rose-500 selection:text-white animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-md shadow-2xl max-w-xl w-full overflow-hidden flex flex-col font-sans">
        {/* Top Header */}
        <div className="p-4 bg-gradient-to-r from-rose-50 via-white to-amber-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-rose-100 text-rose-600 flex items-center justify-center shadow-2xs">
              <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                สนับสนุน & โดเนทแก่ผู้พัฒนาระบบ (Donate)
              </h3>
              <p className="text-[11px] text-slate-500 font-doc">
                ร่วมสนับสนุนการพัฒนา Multimedia Web Application ให้มีฟีเจอร์ใหม่อย่างต่อเนื่อง
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Channel Switcher Tabs */}
        <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50 text-xs font-medium">
          <button
            onClick={() => setActiveChannel('promptpay')}
            className={`py-3 px-2 flex items-center justify-center gap-1.5 border-b-2 transition ${
              activeChannel === 'promptpay'
                ? 'border-blue-600 text-blue-700 bg-white font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-4 h-4 text-blue-600" />
            <span>PromptPay พร้อมเพย์</span>
          </button>

          <button
            onClick={() => setActiveChannel('coffee')}
            className={`py-3 px-2 flex items-center justify-center gap-1.5 border-b-2 transition ${
              activeChannel === 'coffee'
                ? 'border-amber-500 text-amber-800 bg-white font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Coffee className="w-4 h-4 text-amber-600" />
            <span>Buy Me a Coffee</span>
          </button>

          <button
            onClick={() => setActiveChannel('stripe')}
            className={`py-3 px-2 flex items-center justify-center gap-1.5 border-b-2 transition ${
              activeChannel === 'stripe'
                ? 'border-[#635BFF] text-[#635BFF] bg-white font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4 text-[#635BFF]" />
            <span>Stripe บัตรเครดิต</span>
          </button>
        </div>

        {/* Channel Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh] text-xs text-slate-700">
          {/* --- CHANNEL 1: PROMPTPAY QR CODE --- */}
          {activeChannel === 'promptpay' && (
            <div className="space-y-4 text-center">
              {/* Preset Quick Amount Selectors */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-700 block">
                  เลือกจำนวนเงินที่ต้องการสนับสนุน (ระบุยอดใน QR Code อัตโนมัติ):
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[50, 100, 300, 500].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setSelectedPromptPayAmount(amt)}
                      className={`py-1.5 px-2 rounded border font-mono text-xs transition ${
                        selectedPromptPayAmount === amt
                          ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {amt} บาท
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic EMVCo Standard PromptPay QR Code */}
              <div className="w-56 mx-auto bg-white p-3.5 rounded-lg border-2 border-[#113566] shadow-md flex flex-col items-center justify-center relative">
                {/* Official PromptPay Header */}
                <div className="w-full bg-[#113566] text-white py-1.5 px-3 rounded-sm text-center mb-2 shadow-2xs">
                  <div className="text-[11px] font-bold tracking-widest font-mono">PROMPTPAY</div>
                  <div className="text-[9px] text-blue-200 font-doc">สแกนจ่ายผ่านแอปทุกธนาคาร (EMVCo Ready)</div>
                </div>

                <div className="p-1 bg-white border border-slate-200 rounded flex items-center justify-center">
                  <img 
                    src={qrUrl} 
                    alt="PromptPay QR Code"
                    className="w-40 h-40 object-contain rounded"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = backupQrUrl;
                    }}
                  />
                </div>

                <div className="w-full mt-2 pt-2 border-t border-slate-100 text-center">
                  <div className="text-xs font-bold text-slate-800">
                    {selectedPromptPayAmount ? `ยอดชำระ: ${selectedPromptPayAmount}.00 บาท` : 'ระบุยอดเงินตามต้องการ'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-doc">
                    ผู้รับ: {donationConfig.promptPayName}
                  </div>
                </div>
              </div>

              {/* Copy Phone Number & EMVCo Payload Box */}
              <div className="flex flex-col sm:flex-row items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded font-mono text-xs gap-2">
                <div className="text-left w-full sm:w-auto">
                  <span className="text-[10px] text-slate-400 block font-sans">หมายเลขพร้อมเพย์ (064-3026465):</span>
                  <span className="text-sm font-bold text-slate-900">{donationConfig.promptPayNumber}</span>
                  <span className="text-[10px] text-slate-500 font-doc block mt-0.5">{donationConfig.promptPayName}</span>
                </div>
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <button
                    onClick={handleCopyPayload}
                    title="คัดลอกรหัส EMVCo Payload สำหรับแอปธนาคาร"
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium font-sans border border-slate-300 transition"
                  >
                    {copiedPayload ? <Check className="w-3 h-3 text-emerald-600" /> : <QrCode className="w-3 h-3 text-slate-600" />}
                    <span>{copiedPayload ? 'คัดลอกแล้ว' : 'Payload'}</span>
                  </button>

                  <button
                    onClick={handleCopyPromptPay}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium font-sans transition shadow-2xs"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-200" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอกเบอร์'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* --- CHANNEL 2: BUY ME A COFFEE --- */}
          {activeChannel === 'coffee' && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-br from-[#FFDD00]/15 to-[#FFDD00]/5 border border-[#FFDD00]/60 rounded-md text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-[#FFDD00] text-slate-900 flex items-center justify-center shadow-xs">
                  <Coffee className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Buy {donationConfig.promptPayName} a Coffee
                  </h4>
                  <p className="text-xs text-slate-600 font-doc mt-1">
                    {donationConfig.buyMeACoffeeMessage || 'ร่วมสนับสนุนการพัฒนาโปรเจกต์มัลติมีเดีย ☕'}
                  </p>
                </div>

                {/* Cup Selector */}
                <div className="flex items-center justify-center gap-2 pt-2">
                  {[1, 3, 5].map((cups) => (
                    <button
                      key={cups}
                      onClick={() => setCoffeeCups(cups)}
                      className={`px-4 py-2 rounded-md font-sans text-xs flex items-center gap-1.5 transition ${
                        coffeeCups === cups
                          ? 'bg-[#FFDD00] text-slate-900 font-bold shadow-xs border border-amber-400'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span>☕ x {cups}</span>
                      <span className="font-mono font-semibold">(${cups * coffeeUnitPrice})</span>
                    </button>
                  ))}
                </div>

                {/* Direct Action Link */}
                <a
                  href={donationConfig.buyMeACoffeeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full py-3 bg-[#FFDD00] hover:bg-[#ffe433] text-slate-900 font-bold rounded shadow-sm text-xs transition mt-2"
                >
                  <Coffee className="w-4 h-4" />
                  <span>สนับสนุน {coffeeCups} แก้ว (${coffeeCups * coffeeUnitPrice} USD)</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-700" />
                </a>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 space-y-1 font-doc">
                <div className="flex justify-between">
                  <span>ผู้รับการสนับสนุน:</span>
                  <strong className="text-slate-800 font-mono">@{donationConfig.buyMeACoffeeUsername}</strong>
                </div>
                <div className="flex justify-between">
                  <span>ลิงก์โดยตรง:</span>
                  <a href={donationConfig.buyMeACoffeeUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-mono truncate max-w-xs">
                    {donationConfig.buyMeACoffeeUrl}
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* --- CHANNEL 3: STRIPE CARD CHECKOUT --- */}
          {activeChannel === 'stripe' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#635BFF]/10 border border-[#635BFF]/30 rounded-md space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded bg-[#635BFF] text-white flex items-center justify-center font-bold">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Stripe Payment Gateway</h4>
                    <p className="text-[11px] text-slate-500 font-doc">
                      ชำระผ่านบัตรเครดิต/เดบิตระดับสากล ปลอดภัยด้วยการเข้ารหัส SSL 256-bit
                    </p>
                  </div>
                </div>

                {/* Tier Presets */}
                <div className="space-y-2 pt-2">
                  <label className="text-[11px] font-semibold text-slate-700 block">
                    เลือกระดับการสนับสนุน (Support Tier):
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { amount: 5, label: 'Supporter', desc: '$5 USD' },
                      { amount: 15, label: 'Pro Sponsor', desc: '$15 USD' },
                      { amount: 50, label: 'Patron', desc: '$50 USD' },
                    ].map((tier) => (
                      <button
                        key={tier.amount}
                        onClick={() => setStripeAmount(tier.amount)}
                        className={`p-2.5 rounded border text-left transition ${
                          stripeAmount === tier.amount
                            ? 'bg-[#635BFF] text-white border-[#635BFF] shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="font-bold text-xs">{tier.label}</div>
                        <div className="text-[10px] opacity-80 font-mono">{tier.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Direct Stripe Checkout Button */}
                <a
                  href={donationConfig.stripeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full py-3 bg-[#635BFF] hover:bg-[#5349e0] text-white font-bold rounded shadow-sm text-xs transition"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>ดำเนินการชำระผ่าน Stripe (${stripeAmount} {donationConfig.stripeCurrency})</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-600 font-doc">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>รองรับ Visa, Mastercard, JCB, American Express, Apple Pay, Google Pay</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-doc">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>ขอบพระคุณทุกการสนับสนุนโปรเจกต์มัลติมีเดีย</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs font-medium font-sans transition"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
