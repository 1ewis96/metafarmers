import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLayerGroup, faPerson, faGaugeHigh, faInfo, faLocationArrow } from '@fortawesome/free-solid-svg-icons';

const MenuBar = ({ visibleWindows, toggleWindow }) => {
  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      background: '#333',
      borderRadius: '8px',
      padding: '8px 16px',
      boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
      zIndex: 1000
    }}>
      <IconButton 
        icon={faLayerGroup} 
        label="Layer Selector"
        isActive={visibleWindows.layerSelector}
        onClick={() => toggleWindow('layerSelector')}
      />
      <IconButton 
        icon={faPerson} 
        label="Character Skin"
        isActive={visibleWindows.skinSelector}
        onClick={() => toggleWindow('skinSelector')}
      />
      <IconButton 
        icon={faGaugeHigh} 
        label="Speed Controls"
        isActive={visibleWindows.speedControls}
        onClick={() => toggleWindow('speedControls')}
      />
      <IconButton 
        icon={faInfo} 
        label="Character State"
        isActive={visibleWindows.characterState}
        onClick={() => toggleWindow('characterState')}
      />
      <IconButton 
        icon={faLocationArrow} 
        label="Travel"
        isActive={visibleWindows.travelWindow}
        onClick={() => toggleWindow('travelWindow')}
      />
    </div>
  );
};

const IconButton = ({ icon, label, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        background: isActive ? '#555' : 'transparent',
        border: 'none',
        color: isActive ? '#fff' : '#aaa',
        borderRadius: '4px',
        padding: '8px 12px',
        margin: '0 4px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease'
      }}
    >
      <FontAwesomeIcon icon={icon} size="lg" />
    </button>
  );
};

export default MenuBar;
