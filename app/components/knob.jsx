// import styles from './knob.module.css';

// export const links = () => [
//   { rel: "stylesheet", href: styles }
// ];

export const Knob = ({ ariaLabel, selected, onClick }) => {
  return (
    <button
      id=':rgi:'
      className={`track ${selected && 'track_on'}`}
      aria-label={ariaLabel}
      role='switch'
      type='button'
      aria-checked='false'
      onClick={onClick}
    >
      <div className={`knob ${selected && 'knob_on'}`}></div>
    </button>
  );
};
