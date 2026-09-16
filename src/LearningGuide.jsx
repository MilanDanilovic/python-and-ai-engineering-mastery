import React from 'react';
import {BookOpen,ArrowUpRight} from 'lucide-react';
import {CodeEditor} from './CodeEditor.jsx';
import {QuestionPrompt} from './QuestionPrompt.jsx';
import './learning-guide.css';

export function GuidedReading({milestone}){
 const {reading}=milestone.guide;
 return <section className="guided-reading" aria-label={`Guided reading: ${milestone.title}`}>
  <span className="eyebrow green">READ THIS SECTION</span>
  <a href={reading.url} target="_blank" rel="noreferrer" aria-label={`Official documentation: ${reading.title}`}><BookOpen size={16}/>{reading.title}<ArrowUpRight size={14}/></a>
  <p>{reading.focus}</p>
  <small>{new URL(reading.url).hostname} · Section: {decodeURIComponent(new URL(reading.url).hash.slice(1))}</small>
  {milestone.additionalReading&&<a className="guide-related" href={milestone.additionalReading.url} target="_blank" rel="noreferrer">{milestone.additionalReading.title}<ArrowUpRight size={13}/></a>}
 </section>;
}

export function LearningGuide({milestone,compact=false}){
 const guide=milestone.guide;
 return <section className="learning-guide" aria-label={`Learning guide: ${milestone.title}`}>
  <div className="section-heading"><h3>Learn with an example</h3><span className="mini-tag">{guide.kind}</span></div>
  <p>{guide.walkthrough}</p>
  <div className="guide-runtime"><strong>{guide.execution==='local'?'Run in local Python':'Try in Playground'}</strong><span>{guide.packages.length?`Requires ${guide.packages.join(' + ')}${guide.execution==='browser'?' (select the package before running)':''}`:'Python standard library'}{guide.code.includes('await ')?' · Browser examples use top-level await; local scripts need an async entry point.':''}</span></div>
  {guide.kind==='Concept model'&&<p className="guide-model-note">This small model isolates the idea. Use the linked documentation and practical exercise for the framework or production implementation.</p>}
  <CodeEditor value={guide.code} label={`Teaching example: ${milestone.title}`} readOnly height={compact?220:280}/>
  <div className="guide-output"><h4>Expected output</h4><pre>{guide.output}</pre></div>
  <div className="guide-pitfall"><strong>Watch out for</strong><p>{guide.pitfall}</p></div>
  <QuestionPrompt label="Change one thing">{guide.experiment}</QuestionPrompt>
  {!compact&&<p className="guide-transition">Now try the exercises below using a different input. The example above is for learning; it does not mark an exercise complete.</p>}
 </section>;
}
