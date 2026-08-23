// ============================================================
// CONVERGENCE 2026 — Registration & Tracking Portal
// ============================================================

import { useState } from 'react';
import { EVENTS, PARTICIPANT_DATA } from '../data';

export default function RegistrationModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('forms'); // 'forms' or 'tracking'

  if (!isOpen) return null;

  // Live registration stats
  const totalTeams = PARTICIPANT_DATA.totalTeams;
  const totalParticipants = PARTICIPANT_DATA.totalRegistered;
  const totalColleges = PARTICIPANT_DATA.colleges.length;

  return (
    <div className="modal-overlay open" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '850px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="modal-title">REGISTRATION PORTAL</div>
        <p style={{ color: '#aaa', marginBottom: 24, fontSize: '0.9rem' }}>
          Register for events using Google Forms or learn how to track and consolidate participant data.
        </p>

        {/* Tab Buttons */}
        <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid #333', paddingBottom: '12px', marginBottom: '24px' }}>
          <button
            className={`btn-primary ${activeTab === 'forms' ? 'active' : ''}`}
            onClick={() => setActiveTab('forms')}
            style={{
              background: activeTab === 'forms' ? '#C1121F' : 'transparent',
              color: '#fff',
              border: '1px solid #C1121F',
              padding: '8px 16px',
              fontFamily: "'Space Grotesk'",
              fontSize: '0.85rem',
              letterSpacing: '1px',
              cursor: 'pointer',
              textTransform: 'uppercase',
              transition: 'all 0.3s'
            }}
          >
            Google Form Links
          </button>
          <button
            className={`btn-primary ${activeTab === 'tracking' ? 'active' : ''}`}
            onClick={() => setActiveTab('tracking')}
            style={{
              background: activeTab === 'tracking' ? '#C1121F' : 'transparent',
              color: '#fff',
              border: '1px solid #C1121F',
              padding: '8px 16px',
              fontFamily: "'Space Grotesk'",
              fontSize: '0.85rem',
              letterSpacing: '1px',
              cursor: 'pointer',
              textTransform: 'uppercase',
              transition: 'all 0.3s'
            }}
          >
            Participant Tracking Guide
          </button>
        </div>

        {activeTab === 'forms' ? (
          <div>
            <h3 style={{ fontFamily: "'Bebas Neue'", fontSize: '1.5rem', letterSpacing: '1.5px', marginBottom: '16px', color: '#fff' }}>
              Select Event to Register
            </h3>
            <p style={{ color: '#999', fontSize: '0.85rem', marginBottom: '20px' }}>
              Each event has a dedicated Google Form for accurate entry tracking. Click the registration link below for the event(s) you wish to participate in.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', maxHeight: '50vh', overflowY: 'auto', paddingRight: '8px' }}>
              {EVENTS.map((event) => (
                <div
                  key={event.id}
                  style={{
                    background: '#0d0d15',
                    border: '1px solid #222',
                    padding: '16px',
                    borderRadius: '4px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontFamily: "'Space Grotesk'", fontSize: '0.7rem', color: '#C1121F', fontWeight: 'bold', letterSpacing: '1px' }}>
                        EVENT {event.number}
                      </span>
                      <span style={{ fontSize: '0.75rem', background: '#222', color: '#aaa', padding: '2px 8px', borderRadius: '12px' }}>
                        {event.teamSize === '1' ? 'Solo' : `Team: ${event.teamSize}`}
                      </span>
                    </div>
                    <h4 style={{ fontFamily: "'Bebas Neue'", fontSize: '1.4rem', color: '#fff', letterSpacing: '1px', marginBottom: '6px' }}>
                      {event.name}
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '12px' }}>{event.tags}</p>
                    <div style={{ fontSize: '0.8rem', color: '#ccc', marginBottom: '16px' }}>
                      Prize Pool: <strong style={{ color: '#22c55e' }}>{event.prizes}</strong>
                    </div>
                  </div>

                  <a
                    href={event.googleFormUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'block',
                      textAlign: 'center',
                      background: '#C1121F',
                      color: '#fff',
                      padding: '10px',
                      textDecoration: 'none',
                      fontFamily: "'Space Grotesk'",
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      transition: 'background 0.3s',
                    }}
                    onMouseOver={(e) => e.target.style.background = '#e61e2a'}
                    onMouseOut={(e) => e.target.style.background = '#C1121F'}
                  >
                    Open Google Form ↗
                  </a>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ maxHeight: '55vh', overflowY: 'auto', paddingRight: '8px', color: '#ccc' }}>
            <h3 style={{ fontFamily: "'Bebas Neue'", fontSize: '1.6rem', color: '#fff', letterSpacing: '1px', marginBottom: '16px' }}>
              How to Track & Consolidate Participants
            </h3>
            
            {/* Live Stats Preview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', background: '#0a0a0f', border: '1px solid #222', padding: '16px', marginBottom: '24px', borderRadius: '4px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontFamily: "'Bebas Neue'", color: '#fff' }}>{totalParticipants}</div>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#666', letterSpacing: '1px' }}>Participants</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontFamily: "'Bebas Neue'", color: '#22c55e' }}>{totalTeams}</div>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#666', letterSpacing: '1px' }}>Teams</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontFamily: "'Bebas Neue'", color: '#f59e0b' }}>{totalColleges}</div>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#666', letterSpacing: '1px' }}>Colleges</div>
              </div>
            </div>

            <h4 style={{ color: '#fff', fontSize: '1rem', marginBottom: '8px', borderLeft: '3px solid #C1121F', paddingLeft: '8px' }}>
              1. The Master Google Sheet Strategy
            </h4>
            <p style={{ fontSize: '0.85rem', lineHeight: '1.6', marginBottom: '16px' }}>
              When creating the Google Forms, link them all to the <strong>same</strong> Google Spreadsheet. 
              Each form will submit responses to a separate sheet tab within that spreadsheet (e.g. <em>'Form Responses 1'</em>, <em>'Form Responses 2'</em>, etc.).
            </p>

            <h4 style={{ color: '#fff', fontSize: '1rem', marginBottom: '8px', borderLeft: '3px solid #C1121F', paddingLeft: '8px' }}>
              2. Consolidating Tab Data Automatically
            </h4>
            <p style={{ fontSize: '0.85rem', lineHeight: '1.6', marginBottom: '12px' }}>
              You can combine the 8 individual event registration lists automatically into a single Master Dashboard sheet tab. Go to <strong>Extensions &gt; Apps Script</strong> in your Google Sheet and copy/paste this automation script:
            </p>

            <pre style={{
              background: '#050508',
              border: '1px solid #222',
              padding: '12px',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              color: '#34d399',
              overflowX: 'auto',
              marginBottom: '16px',
              lineHeight: '1.4'
            }}>
{`function consolidateRegistrations() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Create or clean Master Sheet
  let master = ss.getSheetByName("Master Registrations");
  if (!master) {
    master = ss.insertSheet("Master Registrations");
  } else {
    master.clear();
  }
  
  // Set headers
  master.appendRow(["Event Name", "Timestamp", "Team/Solo Name", "College", "Contact Email", "Contact Phone", "Members"]);
  
  // Loop through all sheets and copy records
  const sheets = ss.getSheets();
  sheets.forEach(sheet => {
    const name = sheet.getName();
    if (name === "Master Registrations") return;
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return; // Empty sheet
    
    // Rows loop
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      // Format details: Event, Timestamp, TeamName, College, Email, Phone, Members
      master.appendRow([
        name.replace(" Form Responses", ""), // Event Name derived from tab title
        row[0], // Timestamp
        row[1], // Team/Solo Name
        row[2], // College
        row[3], // Email
        row[4], // Phone
        row.slice(5).filter(val => val !== "").join(", ") // Combine member columns
      ]);
    }
  });
}`}
            </pre>

            <h4 style={{ color: '#fff', fontSize: '1rem', marginBottom: '8px', borderLeft: '3px solid #C1121F', paddingLeft: '8px' }}>
              3. Visual Tracking Dashboard
            </h4>
            <p style={{ fontSize: '0.85rem', lineHeight: '1.6', marginBottom: '16px' }}>
              Create a summary tab in Google Sheets using formulas like <code>=COUNTA('Master Registrations'!A2:A)</code> to fetch real-time registration totals. Use simple charts to display which events are getting the highest traction (e.g. Cipher & Coin vs Math Heist).
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
