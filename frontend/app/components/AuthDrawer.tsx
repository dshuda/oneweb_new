'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
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
import { DEMO_PHONE, isValidPhone } from '@/app/lib/auth';

interface AuthDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogin: (phone: string) => void;
  mode?: 'account' | 'checkout' | 'schedule';
}

const OTP_TIMER_SECONDS = 30;
const OTP_EXPIRED_MESSAGE = 'Your code has expired. Please request a new one.';

/* 4-box OTP input with auto-advance and backspace navigation. */
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
      4,
    );
    onChange(next);
    if (digit && index < 3) {
      refs.current[index + 1]?.focus();
    } else if (next.length === 4) {
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
      .slice(0, 4);
    if (digits.length === 4) {
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
      className={`flex justify-center gap-2.5 ${
        shaking ? 'animate-otp-shake' : ''
      }`}
    >
      {[0, 1, 2, 3].map((index) => (
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
          className="h-14 w-12 rounded-xl border border-border bg-white text-center text-xl font-bold text-foreground transition-all outline-none focus:border-primary focus:ring-3 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-muted/50 disabled:text-muted-foreground"
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
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState(DEMO_PHONE);
  const [otp, setOtp] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const [shakeKey, setShakeKey] = useState(0);

  // Reset the form every time the drawer is opened.
  useEffect(() => {
    if (open) {
      setStep('phone');
      setPhone(DEMO_PHONE);
      setOtp('');
      setPhoneError('');
      setOtpError('');
      setResendIn(0);
    }
  }, [open]);

  // 30s resend countdown while the OTP step is active.
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

  const handleGetCode = () => {
    const cleaned = phone.replace(/\s/g, '');
    if (!isValidPhone(cleaned)) {
      setPhoneError('Enter a valid 11-digit number, e.g. 01700000000');
      return;
    }
    setPhone(cleaned);
    setOtp('');
    setOtpError('');
    setResendIn(OTP_TIMER_SECONDS);
    setStep('otp');
  };

  const handleVerify = (code: string = otp) => {
    if (code.length !== 4) {
      setOtpError('Enter the 4-digit verification code');
      setShakeKey((k) => k + 1);
      return;
    }
    if (resendIn <= 0) {
      setOtpError(OTP_EXPIRED_MESSAGE);
      setShakeKey((k) => k + 1);
      return;
    }
    // Demo mode: any 4-digit code completes the login.
    onLogin(phone);
    onOpenChange(false);
    // In checkout/schedule mode the pending flow resumes on its own; only
    // the plain account login sends the user to their profile dashboard.
    if (mode === 'account') {
      router.push('/profile');
    }
  };

  const handleResend = () => {
    setOtp('');
    setOtpError('');
    setResendIn(OTP_TIMER_SECONDS);
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
              {step === 'phone' ? 'Login' : 'Verify OTP'}
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
                src="/illustration_mobile_no.svg"
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
                  You'll receive a 4 digit code to your provided no. shortly
                </p>
              </div>

              <form
                className="w-full space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleGetCode();
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
                  className="w-full rounded-xl bg-primary hover:bg-primary/90"
                >
                  Get Verification Code
                </Button>
              </form>

              <p className="text-xs text-muted-foreground">
                Demo account for testing ·{' '}
                <span className="font-semibold text-foreground">
                  {DEMO_PHONE}
                </span>
              </p>
            </div>
          ) : (
            /* ---- Step 2: OTP ---- */
            <div className="flex flex-col items-center gap-5 text-center">
              <Image
                src="/illustration_otp.svg"
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
                  We sent a 4 digit code to{' '}
                  <span className="font-semibold text-foreground">
                    {phone}
                  </span>
                </p>
              </div>

              <div className="w-full space-y-3">
                <OtpInput
                  value={otp}
                  onChange={(v) => {
                    setOtp(v);
                    setOtpError('');
                  }}
                  onComplete={handleVerify}
                  disabled={resendIn === 0}
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
                disabled={otp.length !== 4 || resendIn === 0}
                onClick={() => handleVerify()}
              >
                Verify & Login
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
                  onClick={handleResend}
                  disabled={resendIn > 0}
                  className={`font-semibold transition-colors ${
                    resendIn > 0
                      ? 'cursor-not-allowed text-muted-foreground'
                      : 'text-primary hover:text-primary/70 hover:underline'
                  }`}
                >
                  {resendIn > 0
                    ? `Resend code in 0:${String(resendIn).padStart(2, '0')}`
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

              <p className="text-xs text-muted-foreground">
                For demo purposes, any 4-digit code works.
              </p>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
