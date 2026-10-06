"use client";

import Image from "next/image";
import Logo from "../Logo";
import { ArrowRight, ChartNoAxesColumnIncreasing, FileText, TrendingUp, Zap } from "lucide-react";
import styles from "./Welcome.module.css";

interface Props {
  onStart: () => void;
}

const benefits = [
  { icon: ChartNoAxesColumnIncreasing, label: "Entenda como sua empresa adquire novos clientes hoje" },
  { icon: TrendingUp, label: "Identifique gargalos na expansão comercial" },
  { icon: FileText, label: "Receba um diagnóstico baseado na sua operação" },
];

export default function Screen0Welcome({ onStart }: Props) {
  return (
    <section className={styles.welcome} aria-labelledby="welcome-title">
      <div className={styles.hero}>
        <div className={styles.portrait}>
          <div className={styles.brandMark} aria-hidden="true" />
          <Image src="/miguel-sac-original.png" alt="Miguel, do Método SAC" fill preload sizes="(max-width: 760px) 90vw, 600px" className={styles.photo} />
        </div>
        <div className={styles.copy}>
          <div className={styles.logo}><Logo size="md" /></div>
          <div className={styles.badge}>
            <Zap size={18} aria-hidden="true" />
            <span><strong>Diagnóstico gratuito</strong><span className={styles.badgeSeparator}> • </span><span className={styles.badgeTime}>Leva menos de 2 minutos</span></span>
          </div>
          <h1 id="welcome-title">Sua empresa consegue crescer <span>sem depender</span> apenas dos representantes?</h1>
          <p className={styles.description}>Responda algumas perguntas sobre sua operação comercial e descubra onde estão as oportunidades para criar um novo canal de aquisição de clientes B2B.</p>
        </div>
        <aside className={styles.introduction}>
          <strong>Miguel — Método SAC</strong>
          <p>Algumas perguntas rápidas para entender sua operação e identificar oportunidades de expansão comercial.</p>
        </aside>
      </div>
      <div className={styles.benefits}>
        {benefits.map(({ icon: Icon, label }) => (
          <div className={styles.benefit} key={label}>
            <span className={styles.icon}><Icon size={30} strokeWidth={1.8} aria-hidden="true" /></span>
            <p>{label}</p>
          </div>
        ))}
      </div>
      <button type="button" onClick={onStart} className={styles.cta}>Quero fazer meu diagnóstico <ArrowRight aria-hidden="true" /></button>
      <p className={styles.footnote}>Gratuito • Rápido • Sem compromisso</p>
    </section>
  );
}
