import { useState } from "react";
import "./jobs.css";

interface SkillProfileProps{
    skills: string[];
    onSkillsChange: (skills: string[]) => void;
}

function SkillProfile({ skills, onSkillsChange }: SkillProfileProps) {
  const [newSkill, setNewSkill] = useState("");
  const [error, setError] = useState("");

  function handleAddSkill() {
    const trimmedSkill = newSkill.trim();

    if (!trimmedSkill) {
      setError("Skill tidak boleh kosong.");
      return;
    }

    const alreadyExists = skills.some(
      (skill) => skill.toLowerCase() === trimmedSkill.toLowerCase()
    );

    if (alreadyExists) {
      setError("Skill sudah ada.");
      return;
    }

    onSkillsChange([...skills, trimmedSkill]);
    setNewSkill("");
    setError("");
  }

  function handleRemoveSkill(skillToRemove: string) {
    if (skills.length <= 3) {
      setError("Minimal harus memiliki 3 skill.");
      return;
    }

    onSkillsChange(skills.filter((skill) => skill !== skillToRemove));
    setError("");
  }

  return (
    <section className="skill-profile">
      <h2 className="section-title">Skill Profile Captain</h2>
      <p>Tambahkan skill yang kamu kuasai (minimal 3 skill).</p>

      <form
        className ="skill-form"
        onSubmit={(event) => {
          event.preventDefault();
          handleAddSkill();
        }}
      >
        <input
          className="skill-input"
          value={newSkill}
          onChange={(event) => setNewSkill(event.target.value)}
          placeholder="Contoh: JavaScript"
        />

        <button className="btn btn-primary" type="submit">Tambah Skill</button>
      </form>

      {error && <p role="alert">{error}</p>}

      <ul className="skill-list">
        {skills.map((skill) => (
          <li className="skill-chip" key={skill}>
            {skill}
            <button
              className="skill-remove"
              type="button"
              onClick={() => handleRemoveSkill(skill)}
            >
              Hapus
            </button>
          </li>
        ))}
      </ul>

      <p>Total skill: {skills.length}</p>
    </section>
  );
}

export default SkillProfile;