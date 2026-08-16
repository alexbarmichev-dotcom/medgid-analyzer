import HistoryDialog from '@/components/site/start-flow/HistoryDialog';
import StartFlowPanel from '@/components/site/start-flow/StartFlowPanel';
import { useStartFlow } from '@/components/site/start-flow/useStartFlow';

const StartFlow = () => {
  const {
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
    analyzing,
    checkingPayment,
    aiResult,
    history,
    historyLoading,
    historyOpen,
    setHistoryOpen,
    isFree,
    authEmailValid,
    sendCode,
    resendCode,
    verifyCode,
    onSubmit,
    onPay,
    addFiles,
    openHistory,
    reset,
  } = useStartFlow();

  return (
    <section id="start" className="relative scroll-mt-20 overflow-hidden">
      <div
        className="paper-lines pointer-events-none absolute inset-0 opacity-40"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent, #000 20%, #000 80%, transparent)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent, #000 20%, #000 80%, transparent)',
        }}
        aria-hidden
      />
      <div className="relative z-10 mx-auto max-w-3xl px-5 py-20 md:px-8">
        <div className="mb-8 text-center">
          <span className="mb-4 inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <span className="h-[7px] w-[7px] rounded-full bg-accent" />
            Личный кабинет
          </span>
          <h2 className="font-head text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
            Начните <span className="hand-underline text-accent">прямо сейчас</span>
          </h2>
        </div>

        <StartFlowPanel
          step={step}
          setStep={setStep}
          authEmail={authEmail}
          setAuthEmail={setAuthEmail}
          code={code}
          setCode={setCode}
          codeSent={codeSent}
          consent={consent}
          setConsent={setConsent}
          sendingCode={sendingCode}
          verifying={verifying}
          authEmailValid={authEmailValid}
          sendCode={sendCode}
          verifyCode={verifyCode}
          resendCode={resendCode}
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
          onSubmit={onSubmit}
          checkingPayment={checkingPayment}
          onPay={onPay}
          aiResult={aiResult}
          reset={reset}
          openHistory={openHistory}
        />
      </div>

      <HistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        history={history}
        historyLoading={historyLoading}
      />
    </section>
  );
};

export default StartFlow;
