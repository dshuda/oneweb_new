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
import { DEMO_PHONE, isValidPhone } from '@/app/lib/auth';
import { saveUserProfile } from '@/app/lib/storage';

interface AuthDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogin: (phone: string) => void;
  mode?: 'account' | 'checkout' | 'schedule';
}

const OTP_TIMER_SECONDS = 60;
const OTP_EXPIRED_MESSAGE = 'Your code has expired. Please request a new one.';
const OTP_LENGTH = 6;

/* 6-box OTP input with auto-advance and backspace navigation. */
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
      className={`flex justify-center gap-2 ${
        shaking ? 'animate-otp-shake' : ''
      }`}
    >
      {Array.from({ length: OTP_LENGTH }).map((_, index) => (
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
          className="h-12 w-10 sm:h-14 sm:w-12 rounded-xl border border-border bg-white text-center text-xl font-bold text-foreground transition-all outline-none focus:border-primary focus:ring-3 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-muted/50 disabled:text-muted-foreground"
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
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const [shakeKey, setShakeKey] = useState(0);
  const [loading, setLoading] = useState(false);

  // Reset the form every time the drawer is opened.
  useEffect(() => {
    if (open) {
      setStep('phone');
      setPhone('');
      setOtp('');
      setPhoneError('');
      setOtpError('');
      setResendIn(0);
      setLoading(false);
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

  // Once countdown hits zero, notify expiration
  useEffect(() => {
    if (step === 'otp' && resendIn === 0 && otp.length > 0) {
      setOtpError(OTP_EXPIRED_MESSAGE);
      setShakeKey((k) => k + 1);
    }
  }, [step, resendIn]);

  const handleGetCode = async () => {
    const cleaned = phone.replace(/\s/g, '');
    if (!isValidPhone(cleaned)) {
      setPhoneError('Enter a valid 11-digit number, e.g. 01700000000');
      return;
    }
    setLoading(true);
    setPhoneError('');
    try {
      const res = await fetch('/api/v1/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleaned }),
      });
      const data = await res.json();
      if (!res.ok || (data && data.success === false)) {
        setPhoneError(data?.message || 'Failed to send OTP. Please try again.');
        setLoading(false);
        return;
      }
      setPhone(cleaned);
      setOtp('');
      setOtpError('');
      setResendIn(OTP_TIMER_SECONDS);
      setStep('otp');
    } catch (err: any) {
      setPhoneError(err?.message || 'Failed to send OTP. Network error.');
    } finally {
      setLoading(false);
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
    setLoading(true);
    setOtpError('');
    try {
      const res = await fetch('/api/v1/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp: code }),
      });
      const data = await res.json();
      if (!res.ok || (data && data.success === false)) {
        setOtpError(data?.message || 'Invalid or expired OTP');
        setShakeKey((k) => k + 1);
        setLoading(false);
        return;
      }

      if (data?.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
        if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
        if (data.userId) localStorage.setItem('userId', data.userId.toString());
      }

      if (data?.name || data?.address) {
        saveUserProfile({
          name: data.name || '',
          address: data.address || '',
        });
      }

      onLogin(phone, data?.name);
      onOpenChange(false);

      if (mode === 'account') {
        router.push('/profile');
      }
    } catch (err: any) {
      setOtpError(err?.message || 'Verification failed. Network error.');
      setShakeKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendIn > 0 || loading) return;
    setLoading(true);
    setOtp('');
    setOtpError('');
    try {
      const res = await fetch('/api/v1/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok || (data && data.success === false)) {
        setOtpError(data?.message || 'Failed to resend OTP.');
        return;
      }
      setResendIn(OTP_TIMER_SECONDS);
    } catch (err: any) {
      setOtpError(err?.message || 'Network error resending OTP.');
    } finally {
      setLoading(false);
    }
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
                  You'll receive a 6-digit code to your mobile number shortly.
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
                  placeholder="01XXXXXXXXX"
                  inputMode="tel"
                  className="h-11 rounded-xl text-center text-base font-semibold tracking-wide"
                  aria-label="Phone number"
                  disabled={loading}
                />
                {phoneError && (
                  <p className="text-sm font-medium text-destructive">
                    {phoneError}
                  </p>
                )}
                <Button
                  type="submit"
                  size="lg"
                  disabled={loading}
                  className="w-full rounded-xl bg-primary hover:bg-primary/90"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    'Get Verification Code'
                  )}
                </Button>
              </form>

              <p className="text-xs text-muted-foreground">
                We'll verify your mobile number via SMS OTP.
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
                  We sent a 6-digit code to{' '}
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
                  disabled={resendIn === 0 || loading}
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
                disabled={otp.length !== OTP_LENGTH || resendIn === 0 || loading}
                onClick={() => handleVerify()}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Login'
                )}
              </Button>

              <div className="flex items-center gap-5 text-sm">
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  disabled={loading}
                  className="font-semibold text-primary transition-colors hover:text-primary/70 hover:underline"
                >
                  Change number
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendIn > 0 || loading}
                  className={`font-semibold transition-colors ${
                    resendIn > 0 || loading
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
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

