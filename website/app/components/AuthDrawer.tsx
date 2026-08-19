'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  MASTER_OTP,
  MASTER_PHONE,
  OTP_LENGTH,
  SHOW_TEST_CREDENTIALS,
  isValidPhone,
  type AuthUser,
} from '@/app/lib/auth';
import { ApiError, sendOtp, updateName, verifyOtp } from '@/app/lib/api';
import { asset } from '@/app/lib/assets';

interface AuthDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogin: (user: AuthUser) => void;
  mode?: 'account' | 'checkout' | 'schedule';
}

const OTP_TIMER_SECONDS = 60;
const OTP_EXPIRED_MESSAGE = 'Your code has expired. Please request a new one.';

/* OTP boxes with auto-advance, backspace navigation and paste support. */
function OtpInput({
  value,
  onChange,
  onComplete,
  disabled = false,
  shakeKey,
}: {
  value: string;
  onChange: (value: string) => void;
  onComplete: (value: string) => void;
  disabled?: boolean;
  shakeKey: number;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const [shaking, setShaking] = useState(false);
  const lastShake = useRef(shakeKey);
  const slots = Array.from({ length: OTP_LENGTH }, (_, i) => i);

  // Replay the shake animation on each fresh request (not on remounts,
  // which carry a stale nonzero shakeKey from earlier rejections).
  useEffect(() => {
    if (shakeKey > lastShake.current) setShaking(true);
    lastShake.current = shakeKey;
  }, [shakeKey]);

  const handleChange = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1);
    const next = (value.slice(0, index) + digit + value.slice(index + 1)).slice(
      0,
      OTP_LENGTH,
    );
    onChange(next);
    if (digit && index < OTP_LENGTH - 1) {
      refs.current[index + 1]?.focus();
    } else if (next.length === OTP_LENGTH) {
      onComplete(next);
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const digits = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, OTP_LENGTH);
    if (digits.length === OTP_LENGTH) {
      e.preventDefault();
      onChange(digits);
      onComplete(digits);
    }
  };

  return (
    <div
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget) setShaking(false);
      }}
      className={`flex justify-center gap-1.5 sm:gap-2 ${
        shaking ? 'animate-otp-shake' : ''
      }`}
    >
      {slots.map((index) => (
        <input
          key={index}
          ref={(el) => {
            refs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[index] ?? ''}
          aria-label={`Digit ${index + 1}`}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={index === 0 ? handlePaste : undefined}
          disabled={disabled}
          className="h-14 w-11 rounded-xl border border-border bg-white text-center text-xl font-bold text-foreground transition-all outline-none focus:border-primary focus:ring-3 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-muted/50 disabled:text-muted-foreground sm:w-12"
        />
      ))}
    </div>
  );
}

export default function AuthDrawer({
  open,
  onOpenChange,
  onLogin,
  mode = 'account',
}: AuthDrawerProps) {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'otp' | 'name'>('phone');
  const [phone, setPhone] = useState(SHOW_TEST_CREDENTIALS ? MASTER_PHONE : '');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [nameError, setNameError] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const [shakeKey, setShakeKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const verifiedUser = useRef<AuthUser | null>(null);

  // Reset the form every time the drawer is opened.
  useEffect(() => {
    if (open) {
      setStep('phone');
      setPhone(SHOW_TEST_CREDENTIALS ? MASTER_PHONE : '');
      setOtp('');
      setName('');
      setPhoneError('');
      setOtpError('');
      setNameError('');
      setResendIn(0);
      setBusy(false);
      verifiedUser.current = null;
    }
  }, [open]);

  // Resend countdown while the OTP step is active.
  useEffect(() => {
    if (step !== 'otp') return;
    const id = setInterval(() => {
      setResendIn((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [step]);

  // Once the countdown hits zero, any code that was entered expires.
  useEffect(() => {
    if (step === 'otp' && resendIn === 0) {
      setOtp('');
      setOtpError(OTP_EXPIRED_MESSAGE);
      setShakeKey((k) => k + 1);
    }
  }, [step, resendIn]);

  const requestOtp = async (target: string) => {
    setBusy(true);
    setOtpError('');
    try {
      const result = await sendOtp(target);
      if (!result.success) {
        setPhoneError(result.message || 'Could not send the code.');
        return false;
      }
      return true;
    } catch (error) {
      setPhoneError(
        error instanceof ApiError
          ? error.message
          : 'Could not send the code. Please try again.',
      );
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleGetCode = async () => {
    const cleaned = phone.replace(/\s/g, '');
    if (!isValidPhone(cleaned)) {
      setPhoneError('Enter a valid 11-digit number, e.g. 01708521990');
      return;
    }
    setPhone(cleaned);
    setPhoneError('');
    if (!(await requestOtp(cleaned))) return;
    setOtp('');
    setOtpError('');
    setResendIn(OTP_TIMER_SECONDS);
    setStep('otp');
  };

  const finish = (user: AuthUser) => {
    onLogin(user);
    onOpenChange(false);
    // In checkout/schedule mode the pending flow resumes on its own; only
    // the plain account login sends the user to their profile dashboard.
    if (mode === 'account') {
      router.push('/profile');
    }
  };

  const handleVerify = async (code: string = otp) => {
    if (code.length !== OTP_LENGTH) {
      setOtpError(`Enter the ${OTP_LENGTH}-digit verification code`);
      setShakeKey((k) => k + 1);
      return;
    }
    if (resendIn <= 0) {
      setOtpError(OTP_EXPIRED_MESSAGE);
      setShakeKey((k) => k + 1);
      return;
    }

    setBusy(true);
    setOtpError('');
    try {
      const result = await verifyOtp(phone, code);
      const user: AuthUser = {
        id: result.userId,
        phone: result.phone || phone,
        name: result.name || undefined,
      };

      // First-time customers are asked for their name before continuing.
      if (result.nameRequired && !user.name) {
        verifiedUser.current = user;
        setStep('name');
        return;
      }
      finish(user);
    } catch (error) {
      setOtp('');
      setShakeKey((k) => k + 1);
      setOtpError(
        error instanceof ApiError
          ? error.status === 401
            ? 'Invalid or expired code. Please try again.'
            : error.message
          : 'Could not verify the code. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  };

  const handleSaveName = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 3) {
      setNameError('Please enter your full name (at least 3 characters).');
      return;
    }
    const pending = verifiedUser.current;
    if (!pending) return;

    setBusy(true);
    setNameError('');
    try {
      await updateName(trimmed);
      finish({ ...pending, name: trimmed });
    } catch (error) {
      setNameError(
        error instanceof ApiError
          ? error.message
          : 'Could not save your name. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    if (!(await requestOtp(phone))) return;
    setOtp('');
    setOtpError('');
    setResendIn(OTP_TIMER_SECONDS);
  };

  const titles: Record<typeof step, string> = {
    phone: 'Login',
    otp: 'Verify OTP',
    name: 'Almost there',
  };

  return (
    <Drawer swipeDirection="right" open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-white">
        <DrawerHeader className="border-b">
          <div className="flex items-center gap-3">
            <DrawerClose
              aria-label="Close"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ArrowLeft size={20} />
            </DrawerClose>
            <DrawerTitle className="text-lg font-bold text-foreground">
              {titles[step]}
            </DrawerTitle>
          </div>
          {mode === 'checkout' && (
            <DrawerDescription className="pb-2">
              Log in to complete your booking
            </DrawerDescription>
          )}
          {mode === 'schedule' && (
            <DrawerDescription className="pb-2">
              Log in to book this service
            </DrawerDescription>
          )}
        </DrawerHeader>

        <div className="flex flex-1 flex-col overflow-y-auto p-6">
          {step === 'phone' ? (
            /* ---- Step 1: Phone number ---- */
            <div className="flex flex-col items-center gap-5 text-center">
              <Image
                src={asset('/illustration_mobile_no.svg')}
                alt=""
                width={200}
                height={200}
                priority
                className="h-40 w-auto"
              />
              <div className="space-y-1.5">
                <h2 className="text-xl font-bold text-foreground">
                  Enter your contact no.
                </h2>
                <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted-foreground">
                  You'll receive a {OTP_LENGTH} digit code to your provided no.
                  shortly
                </p>
              </div>

              <form
                className="w-full space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleGetCode();
                }}
              >
                <Input
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setPhoneError('');
                  }}
                  placeholder="Phone no."
                  inputMode="tel"
                  className="h-11 rounded-xl text-center text-base font-semibold tracking-wide"
                  aria-label="Phone number"
                />
                {phoneError && (
                  <p className="text-sm font-medium text-destructive">
                    {phoneError}
                  </p>
                )}
                <Button
                  type="submit"
                  size="lg"
                  disabled={busy}
                  className="w-full rounded-xl bg-primary hover:bg-primary/90"
                >
                  {busy && <Loader2 size={16} className="animate-spin" />}
                  Get Verification Code
                </Button>
              </form>

              {/* Test credentials are never advertised on a public deploy. */}
              {SHOW_TEST_CREDENTIALS && (
                <p className="text-xs text-muted-foreground">
                  Test account ·{' '}
                  <span className="font-semibold text-foreground">
                    {MASTER_PHONE}
                  </span>{' '}
                  · OTP{' '}
                  <span className="font-semibold text-foreground">
                    {MASTER_OTP}
                  </span>
                </p>
              )}
            </div>
          ) : step === 'otp' ? (
            /* ---- Step 2: OTP ---- */
            <div className="flex flex-col items-center gap-5 text-center">
              <Image
                src={asset('/illustration_otp.svg')}
                alt=""
                width={200}
                height={200}
                className="h-40 w-auto"
              />
              <div className="space-y-1.5">
                <h2 className="text-xl font-bold text-foreground">
                  Enter verification code
                </h2>
                <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted-foreground">
                  We sent a {OTP_LENGTH} digit code to{' '}
                  <span className="font-semibold text-foreground">{phone}</span>
                </p>
              </div>

              <div className="w-full space-y-3">
                <OtpInput
                  value={otp}
                  onChange={(v) => {
                    setOtp(v);
                    setOtpError('');
                  }}
                  onComplete={(v) => void handleVerify(v)}
                  disabled={resendIn === 0 || busy}
                  shakeKey={shakeKey}
                />
                {otpError && (
                  <p
                    role="alert"
                    className="text-sm font-medium text-destructive"
                  >
                    {otpError}
                  </p>
                )}
              </div>

              <Button
                size="lg"
                className="w-full rounded-xl bg-primary hover:bg-primary/90"
                disabled={otp.length !== OTP_LENGTH || resendIn === 0 || busy}
                onClick={() => void handleVerify()}
              >
                {busy && <Loader2 size={16} className="animate-spin" />}
                Verify &amp; Login
              </Button>

              <div className="flex items-center gap-5 text-sm">
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="font-semibold text-primary transition-colors hover:text-primary/70 hover:underline"
                >
                  Change number
                </button>
                <button
                  type="button"
                  onClick={() => void handleResend()}
                  disabled={resendIn > 0 || busy}
                  className={`font-semibold transition-colors ${
                    resendIn > 0 || busy
                      ? 'cursor-not-allowed text-muted-foreground'
                      : 'text-primary hover:text-primary/70 hover:underline'
                  }`}
                >
                  {resendIn > 0
                    ? `Resend code in ${Math.floor(resendIn / 60)}:${String(
                        resendIn % 60,
                      ).padStart(2, '0')}`
                    : 'Resend code'}
                </button>
              </div>

              {/* Resend countdown progress */}
              <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-1000 ease-linear"
                  style={{ width: `${(resendIn / OTP_TIMER_SECONDS) * 100}%` }}
                />
              </div>

              {SHOW_TEST_CREDENTIALS && phone === MASTER_PHONE && (
                <p className="text-xs text-muted-foreground">
                  Test number — use OTP{' '}
                  <span className="font-semibold text-foreground">
                    {MASTER_OTP}
                  </span>
                  .
                </p>
              )}
            </div>
          ) : (
            /* ---- Step 3: Name (first-time customers) ---- */
            <div className="flex flex-col items-center gap-5 text-center">
              <Image
                src={asset('/illustration_mobile_no.svg')}
                alt=""
                width={200}
                height={200}
                className="h-40 w-auto"
              />
              <div className="space-y-1.5">
                <h2 className="text-xl font-bold text-foreground">
                  What should we call you?
                </h2>
                <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted-foreground">
                  Your name appears on your bookings and helps our team reach
                  you.
                </p>
              </div>

              <form
                className="w-full space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSaveName();
                }}
              >
                <Input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setNameError('');
                  }}
                  placeholder="Full name"
                  autoFocus
                  className="h-11 rounded-xl text-center text-base font-semibold"
                  aria-label="Full name"
                />
                {nameError && (
                  <p className="text-sm font-medium text-destructive">
                    {nameError}
                  </p>
                )}
                <Button
                  type="submit"
                  size="lg"
                  disabled={busy}
                  className="w-full rounded-xl bg-primary hover:bg-primary/90"
                >
                  {busy && <Loader2 size={16} className="animate-spin" />}
                  Continue
                </Button>
              </form>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
