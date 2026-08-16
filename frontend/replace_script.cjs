const fs = require('fs');

function replaceInFile(filepath, replacements) {
  let file = fs.readFileSync(filepath, 'utf8');
  for (let [search, replace] of replacements) {
    file = file.replace(search, replace);
  }
  fs.writeFileSync(filepath, file);
}

const userReplacements = [
  ['<span>Good morning, {user?.name || \'Lakshmi\'} 🌸</span>', '<span>{t(\'dashboard.provider.greeting\', { name: user?.name || \'Lakshmi\' })}</span>'],
  ['<span>Aa Options</span>', '<span>{t(\'dashboard.provider.options\')}</span>'],
  ['<h4>Notifications</h4>', '<h4>{t(\'dashboard.provider.notifications\')}</h4>'],
  ['<span>Logout</span>', '<span>{t(\'dashboard.provider.logout\')}</span>'],
  ['label: \'My Matches\'', 'label: t(\'dashboard.provider.tabs.matches\')'],
  ['label: \'Applications\'', 'label: t(\'dashboard.provider.tabs.applications\')'],
  ['label: \'Earnings\'', 'label: t(\'dashboard.provider.tabs.earnings\')'],
  ['label: \'Messages\'', 'label: t(\'dashboard.provider.tabs.messages\')'],
  ['label: \'My Profile\'', 'label: t(\'dashboard.provider.tabs.profile\')'],
  ['label: \'Settings\'', 'label: t(\'dashboard.provider.tabs.settings\')'],
  ['💡 Match scores improve as you interact. Our AI learns what local gigs suit your calendar and preferences over time.', '{t(\'dashboard.provider.matches.ai_tip\')}'],
  ['<span className="text-xs font-bold text-gray-500 uppercase flex items-center mr-2">Category:</span>', '<span className="text-xs font-bold text-gray-500 uppercase flex items-center mr-2">{t(\'dashboard.provider.matches.category\')}</span>'],
  ['label: \'All Categories\'', 'label: t(\'dashboard.provider.matches.all_categories\')'],
  ['label: \'🍳 Cooking\'', 'label: t(\'dashboard.provider.matches.cooking\')'],
  ['label: \'📚 Tutoring\'', 'label: t(\'dashboard.provider.matches.tutoring\')'],
  ['label: \'🌱 Gardening\'', 'label: t(\'dashboard.provider.matches.gardening\')'],
  ['<span className="text-gray-500 uppercase">Distance:</span>', '<span className="text-gray-500 uppercase">{t(\'dashboard.provider.matches.distance\')}</span>'],
  ['label: \'Any\'', 'label: t(\'dashboard.provider.matches.any\')'],
  ['label: \'Nearby (<3km)\'', 'label: t(\'dashboard.provider.matches.nearby\')'],
  ['<span className="text-gray-500 uppercase">Mode:</span>', '<span className="text-gray-500 uppercase">{t(\'dashboard.provider.matches.mode\')}</span>'],
  ['label: \'All\'', 'label: t(\'dashboard.provider.matches.all\')'],
  ['label: \'Online\'', 'label: t(\'dashboard.provider.matches.online\')'],
  ['label: \'In Person\'', 'label: t(\'dashboard.provider.matches.offline\')'],
  ['<h3 className="font-serif text-xl font-bold">No active matches found</h3>', '<h3 className="font-serif text-xl font-bold">{t(\'dashboard.provider.matches.empty_title\')}</h3>'],
  ['Try broadening your filters or complete your profile bio to let our AI build new neighborhood connections.', '{t(\'dashboard.provider.matches.empty_desc\')}'],
  ['Complete Your Profile', '{t(\'dashboard.provider.matches.complete_profile\')}'],
  ['<span className="text-[8px] uppercase font-bold">Match</span>', '<span className="text-[8px] uppercase font-bold">{t(\'dashboard.provider.matches.match\')}</span>'],
  ['Posted {opp.posted}', '{t(\'dashboard.provider.matches.posted\')} {opp.posted}'],
  ['Interested', '{t(\'dashboard.provider.matches.interested\')}'],
  ['Maybe Later', '{t(\'dashboard.provider.matches.maybe_later\')}'],
  ['<h2 className="font-serif text-2xl font-bold">Applications Tracker</h2>', '<h2 className="font-serif text-2xl font-bold">{t(\'dashboard.provider.applications.title\')}</h2>'],
  ['Track your matching service requests from initial interest to neighborhood completions.', '{t(\'dashboard.provider.applications.desc\')}'],
  ['<span>Applied</span>', '<span>{t(\'dashboard.provider.applications.applied\')}</span>'],
  ['<span>Contacted</span>', '<span>{t(\'dashboard.provider.applications.contacted\')}</span>'],
  ['<span>Confirmed</span>', '<span>{t(\'dashboard.provider.applications.confirmed\')}</span>'],
  ['<h2 className="font-serif text-2xl font-bold">My Earnings</h2>', '<h2 className="font-serif text-2xl font-bold">{t(\'dashboard.provider.earnings.title\')}</h2>'],
  ['Track your monthly livelihood achievements and deposits.', '{t(\'dashboard.provider.earnings.desc\')}'],
  ['<span className="text-xs font-bold text-gray-400 uppercase">Livelihood Earned (This Month)</span>', '<span className="text-xs font-bold text-gray-400 uppercase">{t(\'dashboard.provider.earnings.this_month\')}</span>'],
  ['<span className="text-[10px] uppercase font-bold text-gray-400">Total Hours Gained:</span>', '<span className="text-[10px] uppercase font-bold text-gray-400">{t(\'dashboard.provider.earnings.total_hours\')}</span>'],
  ['<span className="text-[10px] uppercase font-bold text-gray-400">Services Provided:</span>', '<span className="text-[10px] uppercase font-bold text-gray-400">{t(\'dashboard.provider.earnings.services_provided\')}</span>'],
  ['<h2 className="font-serif text-2xl font-bold">Neighbor Messages</h2>', '<h2 className="font-serif text-2xl font-bold">{t(\'dashboard.provider.messages.title\')}</h2>'],
  ['Communicate securely with local families matching your gigs.', '{t(\'dashboard.provider.messages.desc\')}']
];

replaceInFile('c:/Users/aswit/Desktop/SilverHands/frontend/src/pages/UserDashboard.jsx', userReplacements);
console.log('Replaced UserDashboard strings');

const empReplacements = [
  ['<span>Good morning, Col. Raghavan 🌸</span>', '<span>{t(\'dashboard.employer.greeting\', { name: user?.name || \'Col. Raghavan\' })}</span>'],
  ['<span>Aa Options</span>', '<span>{t(\'dashboard.provider.options\')}</span>'],
  ['label: \'Post Opportunity\'', 'label: t(\'dashboard.employer.tabs.post\')'],
  ['<span>Post Opportunity</span>', '<span>{t(\'dashboard.employer.tabs.post\')}</span>'],
  ['label: \'My Postings\'', 'label: t(\'dashboard.employer.tabs.postings\')'],
  ['<span>My Postings</span>', '<span>{t(\'dashboard.employer.tabs.postings\')}</span>'],
  ['label: \'Settings\'', 'label: t(\'dashboard.employer.tabs.settings\')'],
  ['<span>Settings</span>', '<span>{t(\'dashboard.employer.tabs.settings\')}</span>'],
  ['label: \'Messages\'', 'label: t(\'dashboard.employer.tabs.messages\')'],
  ['<span>Messages</span>', '<span>{t(\'dashboard.employer.tabs.messages\')}</span>'],
  ['label: \'Safety Center\'', 'label: t(\'dashboard.employer.tabs.safety\')'],
  ['<span>Safety Center</span>', '<span>{t(\'dashboard.employer.tabs.safety\')}</span>'],
  ['<span>Post</span>', '<span>{t(\'dashboard.employer.tabs.post\')}</span>'],
  ['<span>Postings</span>', '<span>{t(\'dashboard.employer.tabs.postings\')}</span>'],
  ['<span>Safety</span>', '<span>{t(\'dashboard.employer.tabs.safety\')}</span>'],
  ['<span>Logout</span>', '<span>{t(\'dashboard.provider.logout\')}</span>'],
  ['<h2 className="font-serif text-2xl font-bold">Post an Opportunity</h2>', '<h2 className="font-serif text-2xl font-bold">{t(\'dashboard.employer.post.title\')}</h2>'],
  ['Write what you need naturally. Our AI will structure it into a neat matching listing.', '{t(\'dashboard.employer.post.desc\')}'],
  ['<label htmlFor="rawText" className="text-sm font-bold">Describe what you need in your own words</label>', '<label htmlFor="rawText" className="text-sm font-bold">{t(\'dashboard.employer.post.describe\')}</label>'],
  ['💡 Insert Sample Request', '{t(\'dashboard.employer.post.sample\')}'],
  ['placeholder="e.g. I need a patient person who can teach my daughter basic math and algebra twice a week online..."', 'placeholder={t(\'dashboard.employer.post.placeholder\')}'],
  ['AI will structure this listing', '{t(\'dashboard.employer.post.ai_structure\')}'],
  ['Structure Listing', '{t(\'dashboard.employer.post.analyze_btn\')}'],
  ['Analyzing...', '{t(\'dashboard.employer.post.analyzing\')}'],
  ['AI Structured Listing Preview', '{t(\'dashboard.employer.post.preview_title\')}'],
  ['<label htmlFor="previewTitle" className="text-xs font-bold text-gray-500">Title</label>', '<label htmlFor="previewTitle" className="text-xs font-bold text-gray-500">{t(\'dashboard.employer.post.field_title\')}</label>'],
  ['<label htmlFor="previewCategory" className="text-xs font-bold text-gray-500">Category Tag</label>', '<label htmlFor="previewCategory" className="text-xs font-bold text-gray-500">{t(\'dashboard.employer.post.field_category\')}</label>'],
  ['<label htmlFor="previewDesc" className="text-xs font-bold text-gray-500">Description</label>', '<label htmlFor="previewDesc" className="text-xs font-bold text-gray-500">{t(\'dashboard.employer.post.field_desc\')}</label>'],
  ['<label htmlFor="previewPay" className="text-xs font-bold text-gray-500">Suggested Pay Range</label>', '<label htmlFor="previewPay" className="text-xs font-bold text-gray-500">{t(\'dashboard.employer.post.field_pay\')}</label>'],
  ['<span className="text-xs font-bold text-gray-500">Location Mode</span>', '<span className="text-xs font-bold text-gray-500">{t(\'dashboard.employer.post.field_mode\')}</span>'],
  ['<label htmlFor="previewTiming" className="text-xs font-bold text-gray-500">Required Timing</label>', '<label htmlFor="previewTiming" className="text-xs font-bold text-gray-500">{t(\'dashboard.employer.post.field_timing\')}</label>'],
  ['Publish Opportunity', '{t(\'dashboard.employer.post.publish_btn\')}'],
  ['<h2 className="font-serif text-2xl font-bold">My Postings</h2>', '<h2 className="font-serif text-2xl font-bold">{t(\'dashboard.employer.postings.title\')}</h2>'],
  ['Manage requests and inspect candidates matched by our AI matching engine.', '{t(\'dashboard.employer.postings.desc\')}'],
  ['Post New Opportunity', '{t(\'dashboard.employer.postings.post_new\')}'],
  ['View Matches ({post.applicantsCount})', '{t(\'dashboard.employer.postings.view_matches\', { count: post.applicantsCount })}'],
  ['AI is searching for candidate matches...', '{t(\'dashboard.employer.postings.ai_searching\')}'],
  ['← Back to My Postings', '{t(\'dashboard.employer.candidates.back\')}'],
  ['<h2 className="font-serif text-2xl font-bold mt-2 pr-12">Matched Candidates</h2>', '<h2 className="font-serif text-2xl font-bold mt-2 pr-12">{t(\'dashboard.employer.candidates.title\')}</h2>'],
  ['Matching candidates for your listing:', '{t(\'dashboard.employer.candidates.desc\')}'],
  ['<span className="text-[8px] uppercase font-bold">Match</span>', '<span className="text-[8px] uppercase font-bold">{t(\'dashboard.employer.candidates.match\')}</span>'],
  ['Age {cand.age}', '{t(\'dashboard.employer.candidates.age\', { age: cand.age })}'],
  ['<strong>Skills:</strong>', '<strong>{t(\'dashboard.employer.candidates.skills\')}</strong>'],
  ['<strong>Availability:</strong>', '<strong>{t(\'dashboard.employer.candidates.availability\')}</strong>'],
  ['View Profile', '{t(\'dashboard.employer.candidates.view_profile\')}'],
  ['Contact Candidate', '{t(\'dashboard.employer.candidates.contact\')}']
];

replaceInFile('c:/Users/aswit/Desktop/SilverHands/frontend/src/pages/EmployerDashboard.jsx', empReplacements);
console.log('Replaced EmployerDashboard strings');
