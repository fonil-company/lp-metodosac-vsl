import { type QuizAnswers, type ResultType } from '@/lib/types';
import Screen18Result from './Screen18Result';

interface Props {
  answers: QuizAnswers;
  result: ResultType;
}

export default function ScreenThankYou({ answers, result }: Props) {
  return (
    <>
      <div className="pt-8 text-center flex flex-col gap-3" role="status">
        <h2 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--color-accent)' }}>
          Obrigado, {answers.firstName}!
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          Seu diagnóstico foi concluído e seus dados foram enviados com sucesso.
        </p>
      </div>
      <Screen18Result answers={answers} result={result} deliveryStatus="sent" onRetry={() => {}} />
    </>
  );
}
