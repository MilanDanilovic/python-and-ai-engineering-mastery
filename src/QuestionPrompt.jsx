import React from 'react';
import './questions.css';

export function QuestionPrompt({children,label='Your task'}){
 return <div className="question-prompt"><span className="question-prompt-label">{label}</span><p>{children}</p></div>;
}
