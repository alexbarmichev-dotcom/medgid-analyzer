import Icon from '@/components/ui/icon';
import AuthStep from '@/components/site/start-flow/AuthStep';
import ProfileFormStep from '@/components/site/start-flow/ProfileFormStep';
import { PayStep, DoneStep } from '@/components/site/start-flow/PayAndResultStep';
import { Step, AuthMode } from '@/components/site/start-flow/useStartFlow';

interface StartFlowPanelProps {
  step: Step;
  setStep: (step: Step) => void;
  authMode: AuthMode;
  anonymousLoading: boolean;
  authEmail: string;
  setAuthEmail: (email: string) => void;
  code: string;
  setCode: (code: string) => void;
  codeSent: boolean;
  consent: boolean;
  setConsent: (consent: boolean) => void;
  sendingCode: boolean;
  verifying: boolean;
  loginValue: string;
  setLoginValue: (v: string) => void;
  passwordValue: string;
  setPasswordValue: (v: string) => void;
  passwordConsent: boolean;
  setPasswordConsent: (v: boolean) => void;
  passwordLoginValid: boolean;
  passwordSubmitting: boolean;
  passwordLogin: () => void;
  authEmailValid: boolean;
  sendCode: () => void;
  verifyCode: () => void;
  resendCode: () => void;
  isFree: boolean;
  gender: 'm' | 'f' | '';
  setGender: (gender: 'm' | 'f' | '') => void;
  age: string;
  setAge: (age: string) => void;
  complaints: string;
  setComplaints: (complaints: string) => void;
  conditions: string;
  setConditions: (conditions: string) => void;
  meds: string;
  setMeds: (meds: string) => void;
  email: string;
  setEmail: (email: string) => void;
  files: File[];
  addFiles: (list: FileList | null) => void;
  analyzing: boolean;
  onSubmit: () => void;
  checkingPayment: boolean;
  onPay: () => void;
  aiResult: string;
  reset: () => void;
  openHistory: () => void;
}

const StartFlowPanel = ({
  step,
  setStep,
  authMode,
  anonymousLoading,
  authEmail,
  setAuthEmail,
  code,
  setCode,
  codeSent,
  consent,
  setConsent,
  sendingCode,
  verifying,
  loginValue,
  setLoginValue,
  passwordValue,
  setPasswordValue,
  passwordConsent,
  setPasswordConsent,
  passwordLoginValid,
  passwordSubmitting,
  passwordLogin,
  authEmailValid,
  sendCode,
  verifyCode,
  resendCode,
  isFree,
  gender,
  setGender,
  age,
  setAge,
  complaints,
  setComplaints,
  conditions,
  setConditions,
  meds,
  setMeds,
  email,
  setEmail,
  files,
  addFiles,
  analyzing,
  onSubmit,
  checkingPayment,
  onPay,
  aiResult,
  reset,
  openHistory,
}: StartFlowPanelProps) => {
  return (
    <>
      {/* progress */}
      <div className="mb-4 flex items-center justify-center gap-2">
        {(['auth', 'form', 'pay', 'done'] as Step[]).map((s, i) => {
          const order = ['auth', 'form', 'pay', 'done'];
          const active = order.indexOf(step) >= i;
          return (
            <span
              key={s}
              className={`h-1.5 w-14 rounded-full transition-colors ${
                active ? 'bg-accent' : 'bg-muted'
              }`}
            />
          );
        })}
      </div>

      {step !== 'auth' && (
        <div className="mb-4 flex justify-center">
          <button
            onClick={openHistory}
            className="inline-flex items-center gap-2 text-lg font-semibold text-hand hover:underline"
          >
            <Icon name="FolderLock" size={20} />
            Ваша медицинская история
          </button>
        </div>
      )}

      <div className="rounded-3xl border border-border bg-card p-6 shadow-[0_26px_50px_-40px_rgba(28,27,24,0.5)] md:p-9">
        {step === 'auth' && authMode === 'anonymous' && (
          <div className="animate-fade-in space-y-5 py-6 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-hand/12 text-hand">
              <Icon
                name={anonymousLoading ? 'Loader2' : 'ShieldCheck'}
                size={26}
                className={anonymousLoading ? 'animate-spin' : ''}
              />
            </span>
            <div>
              <h3 className="font-head text-xl font-bold">
                {anonymousLoading ? 'Открываем свободный доступ…' : 'Доступ свободный'}
              </h3>
              <p className="mt-2 text-ink-soft">
                Для разового разбора анализа верификация не требуется — можно начать сразу.
              </p>
            </div>
          </div>
        )}

        {step === 'auth' && authMode === 'account' && (
          <AuthStep
            email={authEmail}
            setEmail={setAuthEmail}
            code={code}
            setCode={setCode}
            codeSent={codeSent}
            consent={consent}
            setConsent={setConsent}
            sendingCode={sendingCode}
            verifying={verifying}
            emailValid={authEmailValid}
            sendCode={sendCode}
            verifyCode={verifyCode}
            resendCode={resendCode}
            loginValue={loginValue}
            setLoginValue={setLoginValue}
            passwordValue={passwordValue}
            setPasswordValue={setPasswordValue}
            passwordConsent={passwordConsent}
            setPasswordConsent={setPasswordConsent}
            passwordLoginValid={passwordLoginValid}
            passwordSubmitting={passwordSubmitting}
            passwordLogin={passwordLogin}
          />
        )}

        {step === 'form' && (
          <ProfileFormStep
            isFree={isFree}
            gender={gender}
            setGender={setGender}
            age={age}
            setAge={setAge}
            complaints={complaints}
            setComplaints={setComplaints}
            conditions={conditions}
            setConditions={setConditions}
            meds={meds}
            setMeds={setMeds}
            email={email}
            setEmail={setEmail}
            files={files}
            addFiles={addFiles}
            analyzing={analyzing}
            onBack={() => setStep('auth')}
            onSubmit={onSubmit}
          />
        )}

        {step === 'pay' && (
          <PayStep
            analyzing={analyzing}
            checkingPayment={checkingPayment}
            onPay={onPay}
            onBack={() => setStep('form')}
          />
        )}

        {step === 'done' && (
          <DoneStep aiResult={aiResult} reset={reset} openHistory={openHistory} />
        )}
      </div>
    </>
  );
};

export default StartFlowPanel;
