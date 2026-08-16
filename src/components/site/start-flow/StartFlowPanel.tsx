import Icon from '@/components/ui/icon';
import AuthStep from '@/components/site/start-flow/AuthStep';
import ProfileFormStep from '@/components/site/start-flow/ProfileFormStep';
import { PayStep, DoneStep } from '@/components/site/start-flow/PayAndResultStep';
import { Step } from '@/components/site/start-flow/useStartFlow';

interface StartFlowPanelProps {
  step: Step;
  setStep: (step: Step) => void;
  authEmail: string;
  setAuthEmail: (email: string) => void;
  code: string;
  setCode: (code: string) => void;
  codeSent: boolean;
  consent: boolean;
  setConsent: (consent: boolean) => void;
  sendingCode: boolean;
  verifying: boolean;
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
  authEmail,
  setAuthEmail,
  code,
  setCode,
  codeSent,
  consent,
  setConsent,
  sendingCode,
  verifying,
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
        {step === 'auth' && (
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
