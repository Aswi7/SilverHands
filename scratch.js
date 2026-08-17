const fs = require('fs');
const path = require('path');

const userDashPath = 'c:/Users/aswit/Desktop/SilverHands/frontend/src/pages/UserDashboard.jsx';
const empDashPath = 'c:/Users/aswit/Desktop/SilverHands/frontend/src/pages/EmployerDashboard.jsx';
const chatPath = 'c:/Users/aswit/Desktop/SilverHands/frontend/src/components/ChatInterface.jsx';

// 1. Modify UserDashboard.jsx
let userDash = fs.readFileSync(userDashPath, 'utf8');

// Add applications state
if (!userDash.includes('const [applications, setApplications]')) {
  userDash = userDash.replace(
    /const \[activeTab, setActiveTab\] = useState[^;]+;/,
    `$&
  const [applications, setApplications] = useState([]);
  
  useEffect(() => {
    if (activeTab === 'applications' && user?._id) {
      api.get(\`/applications/user/\${user._id}\`)
        .then(res => setApplications(res.data))
        .catch(err => console.error(err));
    }
  }, [activeTab, user]);

  const updateApplicationStatus = async (appId, newStatus) => {
    try {
      await api.patch(\`/applications/\${appId}/\${newStatus === 'completed' ? 'complete' : newStatus === 'in_progress' ? 'check-in' : 'status'}\`, { status: newStatus });
      setApplications(applications.map(app => app._id === appId ? { ...app, status: newStatus } : app));
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  };`
  );
}

// Add employerId to mapped opportunities
userDash = userDash.replace(
  /description: req\.description\n\s*}\)\);/,
  `description: req.description,
          employerId: req.user?._id || req.user
        }));`
);

// Apply button in UserDashboard
userDash = userDash.replace(
  /alert\(\`Applied for "\$\{opp\.title\}" opportunity match!\`\);/,
  `try {
                                await api.post('/applications', {
                                  opportunityId: opp.id,
                                  providerId: user._id,
                                  employerId: opp.employerId || opp.user
                                });
                                alert('Applied successfully!');
                                setActiveTab('applications');
                              } catch (err) {
                                console.error(err);
                                alert('Error applying');
                              }`
);

// Replace Kanban Board
const kanbanStart = userDash.indexOf('{/* Kanban Columns */}');
const kanbanEnd = userDash.indexOf('</div>\n\n            </div>\n          )}\n\n          {/* ================= VIEW: EARNINGS ================= */}');
if (kanbanStart !== -1 && kanbanEnd !== -1) {
  const newKanban = `{/* Kanban Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-start overflow-x-auto pb-4">
                
                {['applied', 'contacted', 'confirmed', 'in_progress', 'completed'].map(statusCol => {
                  const columnApps = applications.filter(a => a.status === statusCol);
                  return (
                    <div key={statusCol} className={\`p-3 rounded-2xl border \${highContrast ? 'border-white' : 'bg-cream-dark/10 border-cream-dark/50'} min-w-[250px]\`}>
                      <h4 className="font-serif font-bold text-sm mb-3 flex justify-between items-center capitalize">
                        <span>{statusCol.replace('_', ' ')}</span>
                        <span className="text-xs bg-cream-dark/40 px-2 py-0.5 rounded font-mono">{columnApps.length}</span>
                      </h4>
                      <div className="flex flex-col gap-3">
                        {columnApps.map(app => (
                          <div key={app._id} className={\`p-3 rounded-xl text-xs flex flex-col gap-2 \${cardTheme}\`}>
                            <span className="font-bold block text-sm">{app.opportunityId?.title || 'Unknown Gig'}</span>
                            <p className={textSecondaryTheme}>Employer: {app.employerId?.name || 'Unknown'}</p>
                            <span className="font-mono text-gray-400 block border-t pt-2 mt-1">Updated: {new Date(app.updatedAt).toLocaleDateString()}</span>
                            
                            <div className="flex flex-wrap gap-2 mt-2">
                              {statusCol === 'applied' && <button onClick={() => updateApplicationStatus(app._id, 'contacted')} className="bg-terracotta text-white px-2 py-1 rounded text-[10px]">Mark Contacted</button>}
                              {statusCol === 'contacted' && <button onClick={() => updateApplicationStatus(app._id, 'confirmed')} className="bg-teal-600 text-white px-2 py-1 rounded text-[10px]">Mark Confirmed</button>}
                              {statusCol === 'confirmed' && <button onClick={() => updateApplicationStatus(app._id, 'in_progress')} className="bg-blue-600 text-white px-2 py-1 rounded text-[10px]">Check-In</button>}
                              {statusCol === 'in_progress' && <button onClick={() => updateApplicationStatus(app._id, 'completed')} className="bg-purple-600 text-white px-2 py-1 rounded text-[10px]">Complete</button>}
                              
                              {statusCol === 'completed' && (
                                <button onClick={() => {
                                  const confirmedTerms = { rate: 500, date: new Date().toISOString(), time: '10:00 AM', taskDescription: 'Repeat booking' };
                                  api.patch(\`/applications/\${app._id}/confirm\`, { confirmedTerms }).then(() => {
                                    alert('Re-booked successfully!');
                                    updateApplicationStatus(app._id, 'confirmed');
                                  });
                                }} className="bg-forest text-white px-2 py-1 rounded text-[10px]">Book Again</button>
                              )}
                              
                              {statusCol === 'completed' && !app.reviewSubmitted && (
                                <button onClick={() => {
                                  const rating = prompt('Enter rating (1-5):', '5');
                                  const comment = prompt('Enter review comment:', 'Great experience!');
                                  if(rating && comment) {
                                    api.post(\`/applications/\${app._id}/review\`, { targetUserId: app.employerId?._id || app.employerId, rating: Number(rating), comment }).then(() => alert('Review submitted!'));
                                  }
                                }} className="border border-cream-dark px-2 py-1 rounded text-[10px]">Leave Review</button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

              `;
  userDash = userDash.substring(0, kanbanStart) + newKanban + userDash.substring(kanbanEnd);
}

fs.writeFileSync(userDashPath, userDash);

// 2. Modify EmployerDashboard.jsx
let empDash = fs.readFileSync(empDashPath, 'utf8');

// Contact candidate button -> create application
empDash = empDash.replace(
  /onClick=\{\(\) => \{\n\s*setActiveTab\('messages'\);\n\s*\}\}/,
  `onClick={async () => {
                            try {
                              const res = await api.post('/applications', {
                                opportunityId: selectedPosting.id,
                                providerId: cand._id,
                                employerId: user._id
                              });
                              setActiveTab('messages');
                            } catch (err) {
                              console.error(err);
                              setActiveTab('messages');
                            }
                          }}`
);
fs.writeFileSync(empDashPath, empDash);

// 3. Modify ChatInterface.jsx
let chatMod = fs.readFileSync(chatPath, 'utf8');

chatMod = chatMod.replace(
  /const \[conversations, setConversations\] = useState\(\[[\s\S]*?\]\);/,
  `const [conversations, setConversations] = useState([]);
  
  useEffect(() => {
    if (user?._id) {
      api.get(\`/applications/user/\${user._id}\`).then(res => {
        const apps = res.data || [];
        const mappedConvs = apps.map(app => {
          const isEmployer = user.role === 'employer' || user.userType === 'employer';
          const otherUser = isEmployer ? app.providerId : app.employerId;
          const otherName = otherUser?.name || 'Unknown User';
          
          return {
            id: app._id,
            name: otherName,
            role: isEmployer ? 'Provider' : 'Employer',
            avatarBg: 'bg-teal-100 text-forest',
            lastMessage: \`Application status: \${app.status}\`,
            timestamp: new Date(app.updatedAt || app.createdAt).toLocaleDateString(),
            unread: 0,
            applicationId: app._id,
            messages: [
              { id: 1, sender: 'receiver', text: \`Application for \${app.opportunityId?.title} (\${app.status})\`, time: new Date(app.createdAt).toLocaleTimeString() }
            ]
          };
        });
        
        const mockBot = {
          id: '3',
          name: 'Sakhi (AI Assistant)',
          role: 'System',
          avatarBg: 'bg-indigo-100 text-indigo-600',
          lastMessage: 'Diwali is coming up in 3 weeks — want me to help you prepare a sweets listing?',
          timestamp: 'Just now',
          unread: 1,
          messages: [
            { 
              id: 301, 
              sender: 'receiver', 
              text: 'Diwali is coming up in 3 weeks — want me to help you prepare a sweets listing?', 
              time: 'Just now',
              isBot: true,
              ctaTitle: 'Prepare My Listing',
              ctaAction: 'prepare_listing'
            }
          ]
        };
        
        setConversations([mockBot, ...mappedConvs]);
      }).catch(err => console.error(err));
    }
  }, [user]);`
);
fs.writeFileSync(chatPath, chatMod);

console.log('Done rewriting files!');
