import { useEffect, useState } from 'react';
import { Pause, Play, RotateCcw, SkipForward } from 'lucide-react';

const QUESTION_DURATION_SECONDS = 120;

const INTERVIEW_QUESTIONS: readonly string[] = [
  'Ceritakan bug tersulit saat mengelola state atau efek samping di proyek React yang pernah kamu buat, dan bagaimana kamu memperbaikinya.',
  'Kapan kamu memilih derived state dibanding menyimpan hasil perhitungan ke useState terpisah? Berikan contoh nyatanya.',
  'Bagaimana cara kamu memastikan proses fetch data dengan useEffect tetap aman dari race condition dan memory leak saat komponen unmount?',
  'Jelaskan perbedaan useRef dan useState, lalu sebutkan dua skenario nyata di mana useRef jauh lebih tepat digunakan.',
  'Mengapa mutasi langsung pada array atau objek bersarang di React dapat menyebabkan bug render? Bagaimana pola update immutable yang benar?',
  'Jika kamu diberi deadline magang yang ketat dengan requirement berubah di tengah jalan, bagaimana cara kamu memprioritaskan dan berkomunikasi dengan tim?',
];

function formatCountdown(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function InterviewPrepTimer() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(QUESTION_DURATION_SECONDS);
  const [isRunning, setIsRunning] = useState(false);

  const shouldTick = isRunning && secondsLeft > 0;

  useEffect(() => {
    if (!shouldTick) return;

    const intervalId = window.setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [shouldTick]);

  function handleToggleRun() {
    if (secondsLeft === 0) {
      setSecondsLeft(QUESTION_DURATION_SECONDS);
      setIsRunning(true);
      return;
    }
    setIsRunning((prev) => !prev);
  }

  function handleReset() {
    setIsRunning(false);
    setSecondsLeft(QUESTION_DURATION_SECONDS);
  }

  function handleNextQuestion() {
    setIsRunning(false);
    setSecondsLeft(QUESTION_DURATION_SECONDS);
    setQuestionIndex((prev) => (prev + 1) % INTERVIEW_QUESTIONS.length);
  }

  const isUrgent = secondsLeft <= 20;
  const isFinished = secondsLeft === 0;

  return (
    <section className="detail-block" aria-labelledby="interview-prep-heading">
      <div className="block-header">
        <h3 id="interview-prep-heading" className="block-title">
          Latihan Interview
        </h3>
        <span className="field-hint tabular-nums">
          Soal {questionIndex + 1} / {INTERVIEW_QUESTIONS.length}
        </span>
      </div>

      <div className="timer-box">
        <p className="timer-question">&ldquo;{INTERVIEW_QUESTIONS[questionIndex]}&rdquo;</p>

        <div className="timer-row">
          <div>
            <div
              className={`timer-display tabular-nums ${isUrgent ? 'is-urgent' : ''}`}
              role="timer"
              aria-live="off"
            >
              {formatCountdown(secondsLeft)}
            </div>
            {isFinished && (
              <span className="field-error">Waktu habis! Lanjut ke soal berikutnya.</span>
            )}
          </div>

          <div className="timer-controls">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleToggleRun}
            >
              {shouldTick ? (
                <>
                  <Pause size={14} aria-hidden="true" />
                  Jeda
                </>
              ) : (
                <>
                  <Play size={14} aria-hidden="true" />
                  {isFinished ? 'Ulangi' : 'Mulai'}
                </>
              )}
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleReset}
              aria-label="Reset timer ke 02:00"
            >
              <RotateCcw size={14} aria-hidden="true" />
              Reset
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleNextQuestion}
            >
              <span>Lanjut</span>
              <SkipForward size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
