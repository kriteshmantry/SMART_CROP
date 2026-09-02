import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { X, CreditCard, Plus, Trash2 } from 'lucide-react';

const LoanInformationModal = ({ isOpen, onClose, onSave, initialData }) => {
  const { t } = useLanguage();
  
  // State holds an array of loans now
  const [loans, setLoans] = useState([]);
  const [hasLoan, setHasLoan] = useState(false);

  const getEmptyLoan = () => ({
    id: Date.now() + Math.random(),
    originalLoanAmount: 100000,
    outstandingPrincipal: 80000,
    annualInterestRate: 8.5,
    totalAmountRepaid: 30000,
    newLoanAmount: 0,
    loanTenureMonths: 12,
    repaymentFrequency: 'Yearly',
    lenderSource: 'Bank'
  });

  useEffect(() => {
    if (initialData) {
      if (initialData.active_loans && initialData.active_loans.length > 0) {
        setLoans(initialData.active_loans);
        setHasLoan(true);
      } else if (initialData.has_loan) {
        // Legacy fallback
        setLoans([{
          id: Date.now(),
          originalLoanAmount: initialData.original_loan_amount || 100000,
          outstandingPrincipal: initialData.outstanding_principal || 80000,
          annualInterestRate: initialData.annual_interest_rate || 8.5,
          totalAmountRepaid: initialData.total_amount_repaid || 30000,
          newLoanAmount: initialData.new_loan_amount || 0,
          loanTenureMonths: initialData.loan_tenure_months || 12,
          repaymentFrequency: initialData.repayment_frequency || 'Yearly',
          lenderSource: initialData.lender_source || 'Bank'
        }]);
        setHasLoan(true);
      } else {
        setLoans([]);
        setHasLoan(false);
      }
    }
  }, [initialData, isOpen]);

  // Auto-calculate Outstanding Principal for all loans
  useEffect(() => {
    setLoans(prevLoans => prevLoans.map(loan => {
      const orig = parseFloat(loan.originalLoanAmount) || 0;
      const repaid = parseFloat(loan.totalAmountRepaid) || 0;
      const newL = parseFloat(loan.newLoanAmount) || 0;
      const rate = parseFloat(loan.annualInterestRate) || 0;
      const tenure = parseInt(loan.loanTenureMonths) || 0;
      
      const totalPrincipal = orig + newL;
      const interest = totalPrincipal * rate * (tenure / 12) / 100;
      const totalDue = totalPrincipal + interest;
      const calculated = Math.max(0, totalDue - repaid);
      
      return { ...loan, outstandingPrincipal: Math.round(calculated * 100) / 100 };
    }));
  }, [
    JSON.stringify(loans.map(l => [l.originalLoanAmount, l.totalAmountRepaid, l.newLoanAmount, l.annualInterestRate, l.loanTenureMonths]))
  ]);

  const handleAddLoan = () => {
    setLoans([...loans, getEmptyLoan()]);
    setHasLoan(true);
  };

  const handleRemoveLoan = (id) => {
    const updated = loans.filter(l => l.id !== id);
    setLoans(updated);
    if (updated.length === 0) setHasLoan(false);
  };

  const updateLoanField = (id, field, value) => {
    setLoans(loans.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Aggregate for backend compatibility
    const totalOutstanding = loans.reduce((sum, l) => sum + (parseFloat(l.outstandingPrincipal) || 0), 0);
    const totalOrig = loans.reduce((sum, l) => sum + (parseFloat(l.originalLoanAmount) || 0), 0);
    const totalRepaid = loans.reduce((sum, l) => sum + (parseFloat(l.totalAmountRepaid) || 0), 0);
    const totalNew = loans.reduce((sum, l) => sum + (parseFloat(l.newLoanAmount) || 0), 0);
    
    // Average or Max values for remaining fields
    const avgInterest = loans.length > 0 ? loans.reduce((sum, l) => sum + (parseFloat(l.annualInterestRate) || 0), 0) / loans.length : 0;
    const maxTenure = loans.length > 0 ? Math.max(...loans.map(l => parseInt(l.loanTenureMonths) || 0)) : 12;
    const freq = loans.length > 0 ? loans[0].repaymentFrequency : 'Yearly';
    const src = loans.length > 0 ? loans[0].lenderSource : 'Bank';

    const payload = {
      has_loan: loans.length > 0,
      original_loan_amount: totalOrig,
      outstanding_principal: totalOutstanding,
      annual_interest_rate: avgInterest,
      total_amount_repaid: totalRepaid,
      new_loan_amount: totalNew,
      loan_tenure_months: maxTenure,
      repayment_frequency: freq,
      lender_source: src,
      active_loans: loans // Store array for frontend rendering
    };
    onSave(payload);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white/95 backdrop-blur-2xl border border-white/80 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl text-gray-900 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between border-b border-emerald-200/80 pb-3.5 mb-4 sticky top-0 bg-white/95 z-10">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-100 rounded-xl text-emerald-700">
              <CreditCard className="h-5 w-5" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-emerald-950 tracking-tight">
              {t("farmer_financial_loan_profile")}
            </h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
                <label className="block text-lg font-bold text-gray-700 uppercase">
                  {t("loan_active_question")}
                </label>
                {hasLoan && (
                    <button type="button" onClick={handleAddLoan} className="text-base flex items-center bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg font-bold hover:bg-emerald-200 transition-colors">
                        <Plus className="w-3 h-3 mr-1"/> Add Another Loan
                    </button>
                )}
            </div>
            {!hasLoan && (
                <div className="grid grid-cols-2 gap-3">
                <button
                    type="button"
                    onClick={handleAddLoan}
                    className="py-2.5 px-4 rounded-xl border text-lg font-extrabold transition-all bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200"
                >
                    {t("yes_active_loan")}
                </button>
                <button
                    type="button"
                    onClick={() => { setHasLoan(false); setLoans([]); }}
                    className="py-2.5 px-4 rounded-xl border text-lg font-extrabold transition-all bg-emerald-600 border-emerald-500 text-white shadow-md"
                >
                    {t("no_loans")}
                </button>
                </div>
            )}
          </div>

          {hasLoan && loans.map((loan, index) => (
            <div key={loan.id} className="space-y-3.5 border border-emerald-200 bg-emerald-50/30 p-3.5 rounded-2xl relative">
              
              <div className="flex justify-between items-center border-b border-emerald-100 pb-2 mb-2">
                  <span className="text-lg font-black text-emerald-800">LOAN #{index + 1}</span>
                  <button type="button" onClick={() => handleRemoveLoan(loan.id)} className="text-base text-red-600 bg-red-100 hover:bg-red-200 px-2 py-1 rounded-lg font-bold flex items-center transition-colors">
                      <Trash2 className="w-3 h-3 mr-1"/> Mark as Cleared
                  </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-lg font-bold text-gray-700 uppercase mb-1">{t("original_loan_amount")}</label>
                  <input
                    type="number"
                    value={loan.originalLoanAmount}
                    onChange={(e) => updateLoanField(loan.id, "originalLoanAmount", e.target.value)}
                    className="w-full bg-white/90 border border-gray-300 rounded-xl px-3.5 py-2.5 text-lg font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none shadow-2xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-lg font-bold text-gray-700 uppercase mb-1">{t("outstanding_principal")}</label>
                  <input
                    type="number"
                    value={loan.outstandingPrincipal}
                    readOnly
                    className="w-full bg-red-50/50 border border-red-200 rounded-xl px-3.5 py-2.5 text-lg font-black text-red-600 outline-none shadow-inner cursor-not-allowed"
                    title="Auto-calculated"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-lg font-bold text-gray-700 uppercase mb-1">{t("annual_interest_rate")}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={loan.annualInterestRate}
                    onChange={(e) => updateLoanField(loan.id, "annualInterestRate", e.target.value)}
                    className="w-full bg-white/90 border border-gray-300 rounded-xl px-3.5 py-2.5 text-lg font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none shadow-2xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-lg font-bold text-gray-700 uppercase mb-1">{t("total_amount_repaid")}</label>
                  <input
                    type="number"
                    value={loan.totalAmountRepaid}
                    onChange={(e) => updateLoanField(loan.id, "totalAmountRepaid", e.target.value)}
                    className="w-full bg-white/90 border border-emerald-300 rounded-xl px-3.5 py-2.5 text-lg font-black text-emerald-700 focus:ring-2 focus:ring-emerald-500 outline-none shadow-2xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-lg font-bold text-gray-700 uppercase mb-1">{t("recent_new_loan")}</label>
                  <input
                    type="number"
                    value={loan.newLoanAmount}
                    onChange={(e) => updateLoanField(loan.id, "newLoanAmount", e.target.value)}
                    className="w-full bg-white/90 border border-gray-300 rounded-xl px-3.5 py-2.5 text-lg font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-lg font-bold text-gray-700 uppercase mb-1">{t("repayment_frequency")}</label>
                  <select
                    value={loan.repaymentFrequency}
                    onChange={(e) => updateLoanField(loan.id, "repaymentFrequency", e.target.value)}
                    className="w-full bg-white/90 border border-gray-300 rounded-xl px-3.5 py-2.5 text-lg font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none shadow-2xs"
                  >
                    <option value="Yearly">{t("yearly")}</option>
                    <option value="Half-yearly">{t("half_yearly")}</option>
                    <option value="Quarterly">{t("quarterly")}</option>
                    <option value="Monthly">{t("monthly")}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-lg font-bold text-gray-700 uppercase mb-1">Tenure (Months)</label>
                  <input
                    type="number"
                    value={loan.loanTenureMonths}
                    onChange={(e) => updateLoanField(loan.id, "loanTenureMonths", e.target.value)}
                    className="w-full bg-white/90 border border-gray-300 rounded-xl px-3.5 py-2.5 text-lg font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none shadow-2xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-lg font-bold text-gray-700 uppercase mb-1">{t("lender_source")}</label>
                  <select
                    value={loan.lenderSource}
                    onChange={(e) => updateLoanField(loan.id, "lenderSource", e.target.value)}
                    className="w-full bg-white/90 border border-gray-300 rounded-xl px-3.5 py-2.5 text-lg font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none shadow-2xs"
                  >
                    <option value="Bank">{t("bank")}</option>
                    <option value="Cooperative">{t("cooperative")}</option>
                    <option value="Government scheme">{t("govt_scheme")}</option>
                    <option value="Microfinance">{t("microfinance")}</option>
                    <option value="Other">{t("other_lender")}</option>
                  </select>
                </div>
              </div>
            </div>
          ))}

          <div className="flex items-center justify-end gap-3 pt-3.5 border-t border-emerald-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-lg font-bold text-gray-600 hover:text-gray-900 transition-colors"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-lg font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md active:scale-95 transition-all"
            >
              {t("save_profile_update_score")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoanInformationModal;
