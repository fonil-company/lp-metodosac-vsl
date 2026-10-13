'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { type QuizAnswers, type QuizState, INITIAL_ANSWERS } from '@/lib/types';
import { calculateResult, getQualificationLevel } from '@/lib/scoring';
import { getUTMParams, generateEventId } from '@/lib/utils';
import { label, OPERATION_TYPE, SEGMENT, AUDIENCE, REVENUE, WHATSAPP_USAGE, COMMERCIAL_SIZE, CLIENT_SOURCE, MARKETING, TRACK_SALES, REPURCHASE, CAPACITY, OBJECTIVE, RESULT, ROLE } from '@/lib/labels';

import ProgressBar from './ProgressBar';
import Logo from './Logo';
import Screen1Name from './screens/Screen1Name';
import Screen2OperationType from './screens/Screen2OperationType';
import Screen5Revenue from './screens/Screen5Revenue';
import Screen9ClientSource from './screens/Screen9ClientSource';
import Screen14FinalForm from './screens/Screen16FinalForm';
import Screen16Result from './screens/Screen18Result';
import ScreenThankYou from './screens/ScreenThankYou';

// Nome, 3 perguntas, contato, resultado e obrigado.
const PROGRESS_STEPS = [0, 1, 2, 3, 4];

export default function QuizApp() {
  const [deliveryStatus, setDeliveryStatus] = useState<'sending' | 'sent' | 'failed'>('sending');
  const submitting = useRef(false);
  const submitted = useRef(false);
  const eventId = useRef(generateEventId());
  const [state, setState] = useState<QuizState>({
    currentStep: 0,
    answers: INITIAL_ANSWERS,
    result: null,
    isSubmitting: false,
    utmParams: {},
  });
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward

  useEffect(() => {
    setState(prev => ({ ...prev, utmParams: getUTMParams() }));
  }, []);

  useEffect(() => {
    const step = state.currentStep + 1;
    window.history.replaceState(null, '', `#etapa${step}`);
    window.parent.postMessage({ type: 'sac-quiz-step', step }, window.location.origin);
  }, [state.currentStep]);

  const goTo = useCallback((step: number, dir = 1) => {
    setDirection(dir);
    setState(prev => ({ ...prev, currentStep: step }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const next = useCallback(() => goTo(state.currentStep + 1, 1), [state.currentStep, goTo]);
  const back = useCallback(() => {
    if (state.currentStep === 0) window.parent.postMessage({ type: 'sac-quiz-close' }, window.location.origin);
    else goTo(state.currentStep - 1, -1);
  }, [state.currentStep, goTo]);

  const updateAnswers = useCallback((updates: Partial<QuizAnswers>) => {
    setState(prev => ({
      ...prev,
      answers: { ...prev.answers, ...updates },
    }));
  }, []);

  const submitAndShowResult = useCallback(async () => {
    if (submitting.current || submitted.current) return;
    submitting.current = true;
    setDeliveryStatus('sending');
    const result = calculateResult(state.answers);
    const qualification = getQualificationLevel(result);

    setState(prev => ({ ...prev, result, isSubmitting: true }));
    // The diagnosis is calculated locally; delivery must not gate its display.
    if (state.currentStep !== 5) goTo(5, 1);

    // Build submission payload
    const payload = {
      // Personal data
      nome_completo: state.answers.fullName,
      primeiro_nome: state.answers.firstName,
      empresa: state.answers.companyName,
      whatsapp: state.answers.whatsapp,
      whatsapp_limpo: state.answers.whatsappClean,
      email: state.answers.email,
      cnpj: state.answers.cnpj,
      cnpj_limpo: state.answers.cnpjClean,
      cidade: state.answers.city,
      estado: state.answers.state,
      cargo: state.answers.role === 'outro' ? state.answers.roleOther : label(ROLE, state.answers.role),
      // Quiz answers (labels em português)
      tipo_operacao: state.answers.operationType === 'outro' ? state.answers.operationTypeOther : label(OPERATION_TYPE, state.answers.operationType),
      segmento: state.answers.segment === 'outro' ? state.answers.segmentOther : label(SEGMENT, state.answers.segment),
      publico_atendido: label(AUDIENCE, state.answers.audience),
      faturamento: label(REVENUE, state.answers.revenue),
      uso_whatsapp: label(WHATSAPP_USAGE, state.answers.whatsappUsage),
      tamanho_comercial: label(COMMERCIAL_SIZE, state.answers.commercialSize),
      origem_clientes: label(CLIENT_SOURCE, state.answers.clientSource),
      investimento_marketing: label(MARKETING, state.answers.marketing),
      rastreio_vendas: label(TRACK_SALES, state.answers.trackSales),
      recompra: label(REPURCHASE, state.answers.repurchase),
      capacidade: label(CAPACITY, state.answers.capacity),
      objetivo: label(OBJECTIVE, state.answers.objective),
      // Result
      resultado_diagnostico: label(RESULT, result),
      nivel_qualificacao: qualification,
      // Meta e rastreamento
      event_id: eventId.current,
      privacy_consent: state.answers.privacyConsent,
      ...state.utmParams,
      url_pagina: window.parent.location.href,
      dispositivo: typeof window !== 'undefined' ? (window.innerWidth <= 768 ? 'mobile' : 'desktop') : '',
      navegador: typeof window !== 'undefined' ? navigator.userAgent : '',
    };

    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(20000),
      });
      if (!response.ok || !(await response.json()).success) throw new Error('submit');
      submitted.current = true;
      setDeliveryStatus('sent');
      goTo(6, 1);
      window.parent.postMessage({ type: 'sac-quiz-complete' }, window.location.origin);
    } catch {
      setDeliveryStatus('failed');
    } finally {
      setState(prev => ({ ...prev, isSubmitting: false }));
      submitting.current = false;
    }
  }, [state.answers, state.utmParams, state.currentStep, goTo]);

  // Progress bar calculation
  const showProgress = state.currentStep >= 0 && state.currentStep <= 4;
  const progressCurrent = PROGRESS_STEPS.filter(step => step <= state.currentStep).length;

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 40 : -40,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({
      x: dir > 0 ? -40 : 40,
      opacity: 0,
    }),
  };

  const renderScreen = () => {
    const props = { answers: state.answers, updateAnswers, next, back };
    switch (state.currentStep) {
      case 0: return <Screen1Name {...props} />;
      case 1: return <Screen2OperationType {...props} />;
      case 2: return <Screen5Revenue {...props} />;
      case 3: return <Screen9ClientSource {...props} />;
      case 4: return <Screen14FinalForm {...props} onSubmit={submitAndShowResult} />;
      case 5: return <Screen16Result answers={state.answers} result={state.result!} deliveryStatus={deliveryStatus} onRetry={submitAndShowResult} />;
      case 6: return <ScreenThankYou answers={state.answers} result={state.result!} />;
      default: return null;
    }
  };

  return (
    /*
     * Mobile: full-screen, single column
     * Desktop (lg+): quiz centrado num card com bordas arredondadas e respiro vertical
     */
    <div
      className="min-h-screen flex flex-col lg:items-center lg:justify-center lg:py-10"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      {/* Card container — borda e sombra só no desktop */}
      <div
        className="quiz-card w-full lg:max-w-2xl lg:rounded-2xl flex flex-col flex-1 lg:flex-none overflow-hidden"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        {/* Header — steps 1-10 */}
        {showProgress && (
          <header className="flex items-center justify-between px-5 pt-5 pb-2">
            <Logo />
            <button
              onClick={back}
              className="text-sm flex items-center gap-1 transition-colors"
              style={{ color: 'var(--color-text-muted)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}
            >
              ← Voltar
            </button>
          </header>
        )}

        {/* Progress bar */}
        {showProgress && <ProgressBar current={progressCurrent} total={PROGRESS_STEPS.length} />}

        {/* Main content */}
        <main className="flex-1 flex flex-col px-5 md:px-8">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={state.currentStep}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="flex-1 flex flex-col"
            >
              {renderScreen()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
