import React, { useState } from 'react';
import { CreditCard, Phone, AlertCircle, Mail, ArrowDown, User, Users, Send, CheckCircle, Star } from 'lucide-react';
import { submitRegistration } from '../services/api';

const Registration: React.FC = () => {
  const [formData, setFormData] = useState({
    teamName: '',
    player1: '',
    player2: '',
    rating1: '',
    rating2: '',
    mobile: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ slotsRemaining: number } | null>(null);
  const [serverError, setServerError] = useState('');

  const validateField = (name: string, value: string): string => {
    if (!value.trim()) return 'This field is required';
    if (name === 'mobile' && !/^(\+63|0)9\d{9}$/.test(value.replace(/\s/g, ''))) {
      return 'Use format: 09XX XXX XXXX';
    }
    if ((name === 'rating1' || name === 'rating2')) {
      const n = Number(value);
      if (isNaN(n) || n < 0) return 'Enter a rating or 0 for unrated';
    }
    return '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    if (error) setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');

    const newErrors: Record<string, string> = {};
    (Object.keys(formData) as (keyof typeof formData)[]).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const result = await submitRegistration({
        teamName: formData.teamName,
        player1: formData.player1,
        player2: formData.player2,
        rating1: Number(formData.rating1) || 0,
        rating2: Number(formData.rating2) || 0,
        mobile: formData.mobile,
      });
      setSubmitResult({ slotsRemaining: result.slotsRemaining });
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full bg-gray-900 rounded-lg py-3 px-4 pl-10 text-white placeholder-gray-600 focus:outline-none transition-all border ${
      errors[field] ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-chess-gold'
    }`;

  return (
    <section id="registration" className="py-20 bg-chess-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">

          <div className="space-y-8">
            <div>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-6">
                REGISTRATION <br /> <span className="text-chess-gold">PROCEDURE</span>
              </h2>
              <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                Slots are limited to <span className="text-chess-red font-bold">70 TEAMS ONLY</span>.
              </p>
            </div>

            {/* Fees Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 shadow-lg border-l-4 border-blue-500 text-gray-900">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-display font-bold text-lg text-blue-600">ONLINE</span>
                  <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">Save ₱100</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-3xl font-bold text-gray-900">₱1,400</span>
                </div>
                <p className="text-red-600 text-xs font-bold mt-1">Until March 6 Only</p>
              </div>

              <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-gray-600 opacity-80">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-display font-bold text-lg text-white">ONSITE</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-3xl font-bold text-white">₱1,500</span>
                </div>
                <p className="text-gray-500 text-xs mt-1">Subject to availability</p>
              </div>
            </div>

            {/* Registration Form */}
            <div className="bg-chess-charcoal p-6 rounded-xl border border-gray-700 shadow-xl">
              <h3 className="font-display text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-chess-gold" />
                PRE-REGISTER TEAM
              </h3>

              {!submitResult ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Team Name */}
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1" htmlFor="teamName">Team Name *</label>
                    <div className="relative">
                      <input
                        id="teamName" type="text" name="teamName"
                        value={formData.teamName} onChange={handleChange} onBlur={handleBlur}
                        placeholder="Enter Team Name"
                        aria-label="Team Name Input" aria-required="true"
                        className={inputClass('teamName')}
                      />
                      <Users className={`absolute left-3 top-3.5 h-4 w-4 ${errors.teamName ? 'text-red-500' : 'text-gray-500'}`} />
                    </div>
                    {errors.teamName && <p className="text-red-500 text-xs mt-1 ml-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.teamName}</p>}
                  </div>

                  {/* Players */}
                  <div className="grid grid-cols-2 gap-4">
                    {(['player1', 'player2'] as const).map((field, i) => (
                      <div key={field}>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1" htmlFor={field}>Player {i + 1} *</label>
                        <div className="relative">
                          <input
                            id={field} type="text" name={field}
                            value={formData[field]} onChange={handleChange} onBlur={handleBlur}
                            placeholder="Full Name"
                            aria-label={`Player ${i + 1} Name`} aria-required="true"
                            className={inputClass(field)}
                          />
                          <User className={`absolute left-3 top-3.5 h-4 w-4 ${errors[field] ? 'text-red-500' : 'text-gray-500'}`} />
                        </div>
                        {errors[field] && <p className="text-red-500 text-xs mt-1 ml-1">{errors[field]}</p>}
                      </div>
                    ))}
                  </div>

                  {/* Ratings */}
                  <div className="grid grid-cols-2 gap-4">
                    {(['rating1', 'rating2'] as const).map((field, i) => (
                      <div key={field}>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1" htmlFor={field}>
                          Player {i + 1} Rating <span className="text-gray-600 normal-case font-normal">(0 = unrated)</span>
                        </label>
                        <div className="relative">
                          <input
                            id={field} type="number" name={field}
                            value={formData[field]} onChange={handleChange} onBlur={handleBlur}
                            placeholder="e.g. 1750"
                            min="0" max="3000"
                            aria-label={`Player ${i + 1} Rating`} aria-required="true"
                            className={inputClass(field)}
                          />
                          <Star className={`absolute left-3 top-3.5 h-4 w-4 ${errors[field] ? 'text-red-500' : 'text-gray-500'}`} />
                        </div>
                        {errors[field] && <p className="text-red-500 text-xs mt-1 ml-1">{errors[field]}</p>}
                      </div>
                    ))}
                  </div>

                  {/* Mobile */}
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1" htmlFor="mobile">Contact Number *</label>
                    <div className="relative">
                      <input
                        id="mobile" type="text" name="mobile"
                        value={formData.mobile} onChange={handleChange} onBlur={handleBlur}
                        placeholder="09XX XXX XXXX"
                        aria-label="Contact Number" aria-required="true"
                        className={inputClass('mobile')}
                      />
                      <Phone className={`absolute left-3 top-3.5 h-4 w-4 ${errors.mobile ? 'text-red-500' : 'text-gray-500'}`} />
                    </div>
                    {errors.mobile && <p className="text-red-500 text-xs mt-1 ml-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.mobile}</p>}
                  </div>

                  {serverError && (
                    <div className="flex items-start gap-2 bg-red-900/20 border border-red-800 rounded-lg p-3">
                      <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                      <p className="text-red-400 text-sm">{serverError}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-chess-gold hover:bg-yellow-400 disabled:opacity-60 disabled:cursor-not-allowed text-black font-bold py-3 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                  >
                    <Send className="h-4 w-4" />
                    {isSubmitting ? 'SUBMITTING…' : 'SUBMIT PRE-REGISTRATION'}
                  </button>
                </form>
              ) : (
                <div className="bg-green-900/20 border border-green-800 rounded-lg p-6 text-center">
                  <div className="inline-flex p-3 bg-green-900/30 rounded-full mb-3">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">Registration Submitted!</h4>
                  <p className="text-gray-300 text-sm mb-1">
                    Please proceed to payment via GCash to secure your slot.
                  </p>
                  <p className="text-gray-300 text-sm mb-4">
                    Send your receipt to the number provided.
                  </p>
                  {submitResult.slotsRemaining > 0 && (
                    <p className="text-chess-gold text-sm font-bold mb-4">
                      {submitResult.slotsRemaining} slot{submitResult.slotsRemaining !== 1 ? 's' : ''} remaining
                    </p>
                  )}
                  <button
                    onClick={() => {
                      setSubmitResult(null);
                      setFormData({ teamName: '', player1: '', player2: '', rating1: '', rating2: '', mobile: '' });
                    }}
                    className="text-chess-gold text-sm underline hover:text-white"
                  >
                    Register another team
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column — Payment */}
          <div className="bg-gradient-to-br from-blue-900 to-blue-800 p-8 md:p-10 rounded-2xl shadow-2xl text-center border border-blue-700 relative overflow-hidden sticky top-24">
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-blue-500 rounded-full opacity-20 blur-3xl"></div>

            <h3 className="font-display text-2xl font-bold text-white mb-8">PAYMENT CHANNEL</h3>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-8 border border-white/20">
              {/* InstaPay QR Code */}
              <div className="flex justify-center mb-4">
                <img
                  src="/instapay-qr.png"
                  alt="InstaPay QR Code"
                  className="w-48 h-48 rounded-lg object-contain bg-white p-1"
                />
              </div>
              <p className="text-blue-300 text-xs font-bold tracking-widest uppercase mb-4">Or pay via GCash number</p>
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="bg-blue-600 p-2 rounded-full">
                  <Phone className="h-5 w-5 text-white" />
                </div>
                <p className="font-display text-3xl md:text-4xl font-bold text-white tracking-widest">0956 358 9090</p>
              </div>
              <p className="font-display text-lg text-blue-200">DANTE SONEJA</p>
            </div>

            <p className="text-blue-200 text-sm mb-6">
              After payment, please message the transaction receipt to the number above along with your Team Name and Player Names.
            </p>

            <div className="mb-6">
              <a
                href="#inquiries"
                className="inline-flex items-center gap-2 px-5 py-2 bg-blue-700/50 hover:bg-blue-700 text-white rounded-full border border-blue-500/50 transition-all text-sm font-medium group"
              >
                <span>Contact Organizers for Inquiries</span>
                <ArrowDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
              </a>
            </div>

            <div id="inquiries" className="pt-6 border-t border-blue-700/50 scroll-mt-24">
              <p className="text-blue-300 text-xs font-bold uppercase tracking-widest mb-4">For Inquiries</p>
              <div className="flex flex-col gap-3 justify-center items-center">
                <div className="flex items-center gap-2 text-white hover:text-blue-200 transition-colors">
                  <Phone className="h-4 w-4 text-blue-400" />
                  <span>0956 358 9090</span>
                </div>
                <div className="flex items-center gap-2 text-white hover:text-blue-200 transition-colors">
                  <Mail className="h-4 w-4 text-blue-400" />
                  <span>pasaychessfederation@gmail.com</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Registration;
