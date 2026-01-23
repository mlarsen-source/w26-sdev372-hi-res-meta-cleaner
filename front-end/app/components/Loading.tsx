'use client';

import './Loading.css';

type Props = {
  message?: string;
};

export default function Loading({ message = 'Loading' }: Props) {
  return (
    <div className="loading">
      <span className="loading-text">{message}</span>
      <div className="loading-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  );
}
