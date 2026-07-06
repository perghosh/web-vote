-- Clear all existing categories first (optional - only if you want to replace)
-- DELETE FROM "TCode" WHERE "CodeGroupK" = 10601;

INSERT INTO "TCode" (
    "CodeK"
   ,"CodeGroupK"
   ,"CreatedD"
   ,"FName"
   ,"FDescription"
) VALUES 
-- CORE POLITICAL CATEGORIES
(10601000, 10601, datetime('now'), 'Politics & Governance', 'Questions about democracy, law, justice, public authorities, government formation, and political systems.'),
(10601001, 10601, datetime('now'), 'Economy & Business', 'Questions about taxes, labor market, entrepreneurship, infrastructure, and trade.'),
(10601002, 10601, datetime('now'), 'Welfare & Healthcare', 'Questions about healthcare, elder care, social services, public health, health insurance, and patient rights.'),
(10601003, 10601, datetime('now'), 'Education & Research', 'Questions about preschool, school, higher education, research funding, and innovation policy.'),
(10601004, 10601, datetime('now'), 'Environment, Climate & Energy', 'Questions about climate policy, energy sources, conservation, recycling, and sustainability.'),
(10601005, 10601, datetime('now'), 'Digitalization & Technology', 'Questions about privacy, data protection, AI ethics, 5G, cybersecurity, and future tech.'),
(10601006, 10601, datetime('now'), 'Culture, Leisure & Communities', 'Questions about sports, associations, art, media, faith communities, and leisure activities.'),
(10601007, 10601, datetime('now'), 'Housing & Urban Development', 'Questions about housing policy, rent control, real estate, construction, and city planning.'),
(10601008, 10601, datetime('now'), 'Transport & Mobility', 'Questions about public transport, roads, aviation, shipping, urban planning, and infrastructure.'),
(10601009, 10601, datetime('now'), 'Immigration & Integration', 'Questions about migration policies, asylum, citizenship, multiculturalism, and integration efforts.'),
(10601010, 10601, datetime('now'), 'Security & Defense', 'Questions about national defense, police, emergency services, terrorism, and civil protection.'),
(10601011, 10601, datetime('now'), 'Foreign Policy & Global Issues', 'Questions about international relations, EU cooperation, UN, peacekeeping, development aid, sanctions, and geopolitics.'),

-- SOCIAL & LIFESTYLE CATEGORIES
(10601012, 10601, datetime('now'), 'Gender Equality & Diversity', 'Questions about equal rights, gender representation, LGBTQ+ issues, discrimination, and inclusion.'),
(10601013, 10601, datetime('now'), 'Work Life & Labor Rights', 'Questions about working conditions, unions, workplace equality, salaries, and employee rights.'),
(10601014, 10601, datetime('now'), 'Food, Health & Nutrition', 'Questions about food safety, dietary guidelines, agriculture, organic farming, and nutrition policy.'),
(10601015, 10601, datetime('now'), 'Lifestyle & Everyday Life', 'Questions about everyday life, consumption, trends, fashion, and personal choices.'),
(10601016, 10601, datetime('now'), 'Relationships & Human Behavior', 'Questions about dating, family life, moral dilemmas, and human psychology.'),
(10601017, 10601, datetime('now'), 'Entertainment & Pop Culture', 'Questions about gaming, streaming, influencers, celebrities, and pop culture phenomena.'),
(10601018, 10601, datetime('now'), 'Youth & Generational Issues', 'Questions about younger generations, internships, student life, and future perspectives.'),

-- PHILOSOPHICAL & ENGAGEMENT CATEGORIES
(10601019, 10601, datetime('now'), 'Ethics & Philosophy', 'Questions about moral philosophy, ethical dilemmas, values, and existential questions.'),
(10601020, 10601, datetime('now'), 'Political History & Trivia', 'Questions about historical events, political figures, and fun facts from the past.'),
(10601021, 10601, datetime('now'), 'Voting System & Democracy Reform', 'Questions about how we vote, election systems, democracy models, and political representation.'),
(10601022, 10601, datetime('now'), 'Fantasy & Hypothetical Politics', 'Hypothetical scenarios, dream policies, creative thought experiments, and "what if" questions.'),
(10601023, 10601, datetime('now'), 'Controversial Debates', 'Hot-button issues and topics that spark vigorous debate and discussion.'),
(10601024, 10601, datetime('now'), 'Local & Municipal Politics', 'Questions about city councils, county politics, local services, and regional governance.'),
(10601025, 10601, datetime('now'), 'Political Parties & Ideologies', 'Questions about party platforms, ideologies, specific party leaders, and political movements.'),

-- QUICK & SPECIAL CATEGORIES
(10601026, 10601, datetime('now'), 'Have Your Say!', 'General, simple, and quick questions with only Yes/No as answer options.'),
(10601027, 10601, datetime('now'), 'Conspiracies & Alternative Theories', 'Questions about hidden truths, alternative theories, historical mysteries, and unexplained phenomena.'),
(10601028, 10601, datetime('now'), 'Other', 'For questions and topics that do not fit into any of the other specific categories.');


INSERT INTO "TCode" (
    "CodeK"
   ,"CodeGroupK"
   ,"CreatedD"
   ,"FName"
   ,"FDescription"
) VALUES 
(10602000, 10602, datetime('now'), 'Single Choice', 'The user can select only one answer option (e.g. Yes/No).'),
(10602001, 10602, datetime('now'), 'Multiple Choice', 'The user can select one or more approved answer options at the same time.'),
(10602002, 10602, datetime('now'), 'Ranking', 'The user ranks the options by preference (1st, 2nd, 3rd place).'),
(10602003, 10602, datetime('now'), 'Rating', 'The user gives points or stars on a scale (e.g. 1-5) for the options.'),
(10602004, 10602, datetime('now'), 'Weighted Voting', 'Votes from different user groups carry different weight based on system settings.'),
(10602005, 10602, datetime('now'), 'Open Input', 'The user votes or responds by entering free text.');



INSERT INTO "TCode" (
    "CodeK"
   ,"CodeGroupK"
   ,"CreatedD"
   ,"FName"
   ,"FDescription"
) VALUES 
(10603000, 10603, datetime('now'), 'Draft', 'The poll is under construction and is not visible to the public.'),
(10603001, 10603, datetime('now'), 'Scheduled', 'Ready for publication and waiting for the configured start date to be reached.'),
(10603002, 10603, datetime('now'), 'Active', 'The poll is live and open to receive votes from users.'),
(10603003, 10603, datetime('now'), 'Paused', 'Voting is temporarily stopped; no new votes are being registered at the moment.'),
(10603004, 10603, datetime('now'), 'Closed', 'The voting period has ended. The result is locked but can still be read.'),
(10603005, 10603, datetime('now'), 'Archived', 'Hidden from the regular views and stored only for historical statistics.');
