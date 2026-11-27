import { useState } from 'react';
import { Plus, X } from 'lucide-react';

interface SkillProfileProps {
  skills: string[];
  onSkillsChange: (skills: string[]) => void;
}

export default function SkillProfile({ skills, onSkillsChange }: SkillProfileProps) {
  const [newSkill, setNewSkill] = useState('');
  const [error, setError] = useState('');

  function handleAddSkill(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = newSkill.trim();

    if (!trimmed) {
      setError('Masukkan nama skill.');
      return;
    }

    const exists = skills.some((s) => s.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setError(`Skill "${trimmed}" sudah ada.`);
      return;
    }

    onSkillsChange([...skills, trimmed]);
    setNewSkill('');
    setError('');
  }

  function handleRemoveSkill(skillToRemove: string) {
    onSkillsChange(skills.filter((s) => s !== skillToRemove));
    setError('');
  }

  return (
    <section
      className="control-pane is-cream"
      aria-labelledby="skill-profile-heading"
    >
      <h2 id="skill-profile-heading" className="panel-heading">
        Skill Kapten ({skills.length})
      </h2>

      <form className="skill-add-row" onSubmit={handleAddSkill}>
        <label htmlFor="kapten-skill-input" className="sr-only">
          Tambah skill baru
        </label>
        <input
          id="kapten-skill-input"
          className={`input ${error ? 'is-invalid' : ''}`}
          value={newSkill}
          onChange={(e) => {
            setNewSkill(e.target.value);
            if (error) setError('');
          }}
          placeholder="Tambah skill (Docker, Go, Figma)..."
        />
        <button type="submit" className="btn btn-primary btn-sm" style={{ height: 40 }}>
          <Plus size={15} aria-hidden="true" />
          Tambah
        </button>
      </form>

      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}

      {skills.length > 0 && (
        <ul className="skill-chip-list" aria-label="Daftar skill Kapten">
          {skills.map((skill) => (
            <li key={skill} className="skill-chip">
              <span>{skill}</span>
              <button
                type="button"
                className="skill-chip-remove"
                onClick={() => handleRemoveSkill(skill)}
                aria-label={`Hapus skill ${skill}`}
              >
                <X size={13} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
