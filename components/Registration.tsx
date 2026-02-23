import React, { useState } from 'react';
import {
  Phone,
  AlertCircle,
  Mail,
  ArrowDown,
  User,
  Users,
  Send,
  CheckCircle,
  Star,
  MessageCircle,
} from 'lucide-react';
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

  const MAX_AVE = 1975;
  const RATING_FLOOR = 1800;

  const normalizeRating = (val: string): number => {
    const n = Number(val);
    if (!val.trim() || Number.isNaN(n) || n <= 0) return RATING_FLOOR;
    return n < RATING_FLOOR ? RATING_FLOOR : n;
  };

  const norm1 = normalizeRating(formData.rating1);
  const norm2 = normalizeRating(formData.rating2);
  const teamAverage = (norm1 + norm2) / 2;
  const bothRatingsEntered = formData.rating1.trim() !== '' && formData.rating2.trim() !== '';
  const isEligible = teamAverage <= MAX_AVE;

  const validateField = (name: string, value: string): string => {
    if (!value.trim()) return 'This field is required';
    if (name === 'mobile' && !/^(\+63|0)9\d{9}$/.test(value.replace(/\s/g, ''))) {
      return 'Use format: 09XX XXX XXXX';
    }
    if (name === 'rating1' || name === 'rating2') {
      const n = Number(value);
      if (Number.isNaN(n) || n < 0) return 'Enter a rating or 0 for unrated';
    }
    return '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    if (error) setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');

    const newErrors: Record<string, string> = {};
    (Object.keys(formData) as (keyof typeof formData)[]).forEach((key) => {
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
    `w-full rounded-xl border bg-slate-950/60 py-3 pl-10 pr-4 text-white outline-none transition ${
      errors[field]
        ? 'border-red-500 focus:border-red-500'
        : 'border-white/10 focus:border-chess-cyan'
    }`;

  return (
    <section id="registration" className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-start gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-chess-cyan">Sign Up</p>
              <h2 className="section-title text-4xl font-bold text-white">Registration Procedure</h2>
              <p className="mt-3 text-lg muted-text">
                Slots are limited to <span className="font-bold text-chess-red">70 teams only</span>.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <article className="panel border-blue-400/30 bg-blue-600/10 p-4">
                <div className="flex items-center justify-between">
                  <p className="section-title text-lg text-blue-200">Online</p>
                  <span className="rounded-full bg-blue-300/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-100">
                    Save PHP 100
                  </span>
                </div>
                <p className="mt-3 text-3xl font-bold text-white">PHP 1,400</p>
                <p className="mt-1 text-xs text-blue-100/80">Until March 6 only</p>
              </article>
              <article className="panel p-4">
                <p className="section-title text-lg text-slate-200">Onsite</p>
                <p className="mt-3 text-3xl font-bold text-white">PHP 1,500</p>
                <p className="mt-1 text-xs text-slate-400">Subject to availability</p>
              </article>
            </div>

            <div className="panel p-6">
              <h3 className="section-title mb-4 flex items-center gap-2 text-xl text-white">
                <Users className="h-5 w-5 text-chess-gold" />
                Pre-register Team
              </h3>

              {!submitResult ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <label className="block">
                    <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">Team name</span>
                    <div className="relative">
                      <input
                        id="teamName"
                        type="text"
                        name="teamName"
                        value={formData.teamName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Enter team name"
                        className={inputClass('teamName')}
                        aria-required="true"
                      />
                      <Users className={`absolute left-3 top-3.5 h-4 w-4 ${errors.teamName ? 'text-red-500' : 'text-slate-500'}`} />
                    </div>
                    {errors.teamName && <p className="mt-1 text-xs text-red-400">{errors.teamName}</p>}
                  </label>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {(['player1', 'player2'] as const).map((field, i) => (
                      <label key={field} className="block">
                        <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">
                          Player {i + 1}
                        </span>
                        <div className="relative">
                          <input
                            id={field}
                            type="text"
                            name={field}
                            value={formData[field]}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="Full name"
                            className={inputClass(field)}
                            aria-required="true"
                          />
                          <User className={`absolute left-3 top-3.5 h-4 w-4 ${errors[field] ? 'text-red-500' : 'text-slate-500'}`} />
                        </div>
                        {errors[field] && <p className="mt-1 text-xs text-red-400">{errors[field]}</p>}
                      </label>
                    ))}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {(['rating1', 'rating2'] as const).map((field, i) => (
                      <label key={field} className="block">
                        <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">
                          Player {i + 1} rating
                          <span className="ml-1 normal-case font-normal text-slate-500">(0 = unrated)</span>
                        </span>
                        <div className="relative">
                          <input
                            id={field}
                            type="number"
                            name={field}
                            value={formData[field]}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="e.g. 1750"
                            min="0"
                            max="3000"
                            className={inputClass(field)}
                            aria-required="true"
                          />
                          <Star className={`absolute left-3 top-3.5 h-4 w-4 ${errors[field] ? 'text-red-500' : 'text-slate-500'}`} />
                        </div>
                        {errors[field] && <p className="mt-1 text-xs text-red-400">{errors[field]}</p>}
                      </label>
                    ))}
                  </div>

                  {bothRatingsEntered && (
                    <div className={`rounded-xl border p-4 ${isEligible ? 'border-emerald-500/40 bg-emerald-900/20' : 'border-red-500/40 bg-red-900/20'}`}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Team average rating</span>
                        {isEligible ? (
                          <CheckCircle className="h-5 w-5 text-emerald-300" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-300" />
                        )}
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className={`text-3xl font-bold ${isEligible ? 'text-emerald-300' : 'text-red-300'}`}>
                          {teamAverage.toFixed(1)}
                        </span>
                        <span className="text-sm text-slate-500">/ {MAX_AVE} max</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
                        <span>P1: {norm1} {Number(formData.rating1) < RATING_FLOOR ? '(floor)' : ''}</span>
                        <span>P2: {norm2} {Number(formData.rating2) < RATING_FLOOR ? '(floor)' : ''}</span>
                      </div>
                      {!isEligible && (
                        <p className="mt-2 text-xs font-semibold text-red-300">
                          Team average exceeds {MAX_AVE}. This team is not eligible.
                        </p>
                      )}
                    </div>
                  )}

                  <label className="block">
                    <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">Contact number</span>
                    <div className="relative">
                      <input
                        id="mobile"
                        type="text"
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="09XX XXX XXXX"
                        className={inputClass('mobile')}
                        aria-required="true"
                      />
                      <Phone className={`absolute left-3 top-3.5 h-4 w-4 ${errors.mobile ? 'text-red-500' : 'text-slate-500'}`} />
                    </div>
                    {errors.mobile && <p className="mt-1 text-xs text-red-400">{errors.mobile}</p>}
                  </label>

                  {serverError && (
                    <div className="flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-900/20 p-3">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                      <p className="text-sm text-red-300">{serverError}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting || (bothRatingsEntered && !isEligible)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-chess-gold to-amber-500 px-4 py-3 font-bold text-slate-900 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Send className="h-4 w-4" />
                    {isSubmitting ? 'SUBMITTING...' : 'SUBMIT PRE-REGISTRATION'}
                  </button>
                </form>
              ) : (
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-900/20 p-6 text-center">
                  <div className="inline-flex rounded-full bg-emerald-900/30 p-3">
                    <CheckCircle className="h-8 w-8 text-emerald-300" />
                  </div>
                  <h4 className="section-title mt-3 text-xl text-white">Registration submitted</h4>
                  <p className="mt-2 text-sm text-slate-300">
                    Proceed with payment and send your receipt to secure your slot.
                  </p>
                  {submitResult.slotsRemaining > 0 && (
                    <p className="mt-3 text-sm font-bold text-chess-gold">
                      {submitResult.slotsRemaining} slot{submitResult.slotsRemaining !== 1 ? 's' : ''} remaining
                    </p>
                  )}
                  <a
                    href="FB_GC_INVITE_LINK_HERE"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Join tournament GC
                  </a>
                  <p className="mt-2 text-xs text-slate-500">Join for updates, pairings, and announcements.</p>
                  <button
                    onClick={() => {
                      setSubmitResult(null);
                      setFormData({
                        teamName: '',
                        player1: '',
                        player2: '',
                        rating1: '',
                        rating2: '',
                        mobile: '',
                      });
                    }}
                    className="mt-4 text-sm text-chess-cyan underline transition hover:text-cyan-200"
                  >
                    Register another team
                  </button>
                </div>
              )}
            </div>

          </div>

          <aside className="panel sticky top-24 overflow-hidden p-6 sm:p-8">
            <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-chess-cyan/20 blur-3xl" />

            <h3 className="section-title relative z-10 text-2xl text-white">Payment Channel</h3>

            <div className="relative z-10 mt-6 rounded-xl border border-white/15 bg-white/5 p-5 text-center">
              <img
                src="/instapay-qr.png"
                alt="InstaPay QR code"
                className="mx-auto h-48 w-48 rounded-lg bg-white p-1 object-contain"
              />
              <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-blue-200">Or pay via GCash</p>
              <div className="mt-3 flex items-center justify-center gap-2">
                <Phone className="h-4 w-4 text-blue-200" />
                <p className="section-title text-3xl font-bold text-white">0956 358 9090</p>
              </div>
              <p className="mt-1 text-sm text-blue-100">DANTE SONEJA</p>
            </div>

            <p className="relative z-10 mt-5 text-sm text-slate-300">
              Send your payment receipt with team name and player names to the contact number above.
            </p>

            <div className="relative z-10 mt-6">
              <a
                href="#inquiries"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-slate-100 transition hover:bg-white/10"
              >
                Contact organizers
                <ArrowDown className="h-4 w-4" />
              </a>
            </div>

            <div id="inquiries" className="relative z-10 mt-6 border-t border-white/10 pt-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">For inquiries</p>
              <div className="mt-3 space-y-2 text-sm text-slate-200">
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-chess-cyan" />
                  0956 358 9090
                </p>
                <p className="flex items-center gap-2 break-all">
                  <Mail className="h-4 w-4 text-chess-cyan" />
                  pasaychessfederation@gmail.com
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
};

export default Registration;
