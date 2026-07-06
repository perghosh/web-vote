INSERT INTO "TCode" (
    "CodeK"
   ,"CodeGroupK"
   ,"CreatedD"
   ,"FName"
   ,"FDescription"
) VALUES 
-- KÄRNPOLITISKA KATEGORIER
(10601000, 10601, datetime('now'), 'Politik & Samhällsstyrning', 'Frågor om demokrati, lag och rätt, myndigheter, regeringsbildning och politiska system.'),
(10601001, 10601, datetime('now'), 'Ekonomi & Näringsliv', 'Frågor om skatter, arbetsmarknad, företagande, infrastruktur och handel.'),
(10601002, 10601, datetime('now'), 'Välfärd & Hälsovård', 'Frågor om sjukvård, äldreomsorg, socialtjänst, folkhälsa, sjukförsäkring och patienträttigheter.'),
(10601003, 10601, datetime('now'), 'Utbildning & Forskning', 'Frågor om förskola, skola, högre utbildning, forskningsanslag och innovationspolitik.'),
(10601004, 10601, datetime('now'), 'Miljö, Klimat & Energi', 'Frågor om klimatpolitik, energikällor, naturvård, återvinning och hållbarhet.'),
(10601005, 10601, datetime('now'), 'Digitalisering & Teknik', 'Frågor om integritet, dataskydd, AI-etik, 5G, cybersäkerhet och framtidsteknik.'),
(10601006, 10601, datetime('now'), 'Kultur, Fritid & Gemenskap', 'Frågor om idrott, föreningsliv, konst, media, trossamfund och fritidsaktiviteter.'),
(10601007, 10601, datetime('now'), 'Bostäder & Stadsutveckling', 'Frågor om bostadspolitik, hyresreglering, fastigheter, byggande och stadsplanering.'),
(10601008, 10601, datetime('now'), 'Transport & Mobilitet', 'Frågor om kollektivtrafik, vägar, flyg, sjöfart, stadsplanering och infrastruktur.'),
(10601009, 10601, datetime('now'), 'Invandring & Integration', 'Frågor om migrationspolitik, asyl, medborgarskap, mångkultur och integrationsinsatser.'),
(10601010, 10601, datetime('now'), 'Säkerhet & Försvar', 'Frågor om nationellt försvar, polis, räddningstjänst, terrorism och civilt skydd.'),
(10601011, 10601, datetime('now'), 'Utrikespolitik & Globala Frågor', 'Frågor om internationella relationer, EU-samarbete, FN, fredsbevarande insatser, bistånd, sanktioner och geopolitik.'),

-- SOCIALA & LIVSSTILSKATEGORIER
(10601012, 10601, datetime('now'), 'Jämställdhet & Mångfald', 'Frågor om lika rättigheter, könsrepresentation, HBTQ-frågor, diskriminering och inkludering.'),
(10601013, 10601, datetime('now'), 'Arbetsliv & Arbetstagarrättigheter', 'Frågor om arbetsvillkor, fackföreningar, jämställdhet på arbetsplatsen, löner och anställdas rättigheter.'),
(10601014, 10601, datetime('now'), 'Mat, Hälsa & Näringslära', 'Frågor om livsmedelssäkerhet, kostråd, jordbruk, ekologisk odling och näringspolitik.'),
(10601015, 10601, datetime('now'), 'Livsstil & Vardagsliv', 'Frågor om vardagsliv, konsumtion, trender, mode och personliga val.'),
(10601016, 10601, datetime('now'), 'Relationer & Mänskligt Beteende', 'Frågor om dejting, familjeliv, moraliska dilemman och mänsklig psykologi.'),
(10601017, 10601, datetime('now'), 'Underhållning & Popkultur', 'Frågor om gaming, streaming, influencers, kändisar och popkulturella fenomen.'),
(10601018, 10601, datetime('now'), 'Ungdom & Generationsfrågor', 'Frågor om yngre generationer, praktikplatser, studentliv och framtidsperspektiv.'),

-- FILOSOFISKA & ENGAGEMANGSKATEGORIER
(10601019, 10601, datetime('now'), 'Etik & Filosofi', 'Frågor om moralfilosofi, etiska dilemman, värderingar och existentiella frågor.'),
(10601020, 10601, datetime('now'), 'Politisk Historia & Kuriosa', 'Frågor om historiska händelser, politiska personligheter och roliga fakta från förr.'),
(10601021, 10601, datetime('now'), 'Röstsystem & Demokratireform', 'Frågor om hur vi röstar, valsystem, demokratimodeller och politisk representation.'),
(10601022, 10601, datetime('now'), 'Fantasi & Hypotetisk Politik', 'Hypotetiska scenarier, drömpolitik, kreativa tankeexperiment och "tänk om"-frågor.'),
(10601023, 10601, datetime('now'), 'Kontroversiella Debatter', 'Brännheta frågor och ämnen som väcker livlig debatt och diskussion.'),
(10601024, 10601, datetime('now'), 'Lokal & Kommunal Politik', 'Frågor om kommunfullmäktige, regionpolitik, lokala tjänster och regional styrning.'),
(10601025, 10601, datetime('now'), 'Politiska Partier & Ideologier', 'Frågor om partiprogram, ideologier, specifika partiledare och politiska rörelser.'),

-- SNABBA & SPECIALKATEGORIER
(10601026, 10601, datetime('now'), 'Tyck till!', 'Allmänna, enkla och snabba frågor med enbart Ja/Nej som svarsalternativ.'),
(10601027, 10601, datetime('now'), 'Konspirationer & Alternativa Teorier', 'Frågor om dolda sanningar, alternativa teorier, historiska mysterier och oförklarliga fenomen.'),
(10601028, 10601, datetime('now'), 'Övrigt', 'För frågor och ämnen som inte passar in i någon av de andra specifika kategorierna.');



INSERT INTO "TCode" (
    "CodeK"
   ,"CodeGroupK"
   ,"CreatedD"
   ,"FName"
   ,"FDescription"
) VALUES 
(10602000, 10602, datetime('now'), 'Enkelval', 'Användaren kan endast välja ett svarsalternativ (t.ex. Ja/Nej).'),
(10602001, 10602, datetime('now'), 'Flerval', 'Användaren kan välja ett eller flera godkända svarsalternativ samtidigt.'),
(10602002, 10602, datetime('now'), 'Rangordning', 'Användaren rangordnar alternativen efter preferens (1:a, 2:a, 3:e plats).'),
(10602003, 10602, datetime('now'), 'Betygssättning', 'Användaren ger poäng eller stjärnor på en skala (t.ex. 1-5) för alternativen.'),
(10602004, 10602, datetime('now'), 'Viktad omröstning', 'Röster från olika användargrupper har olika tyngd baserat på systeminställningar.'),
(10602005, 10602, datetime('now'), 'Öppen insamling', 'Användaren röstar eller svarar genom att skriva in fri text.');



INSERT INTO "TCode" (
    "CodeK"
   ,"CodeGroupK"
   ,"CreatedD"
   ,"FName"
   ,"FDescription"
) VALUES 
(10603000, 10603, datetime('now'), 'Utkast', 'Omröstningen är under konstruktion och är inte synlig för allmänheten.'),
(10603001, 10603, datetime('now'), 'Schemalagd', 'Klar för publicering och väntar på att det inställda startdatumet ska infalla.'),
(10603002, 10603, datetime('now'), 'Aktiv', 'Omröstningen är live och öppen för att ta emot röster från användare.'),
(10603003, 10603, datetime('now'), 'Pausad', 'Röstningen är tillfälligt stoppad, inga nya röster registreras för tillfället.'),
(10603004, 10603, datetime('now'), 'Stängd', 'Röstningsperioden är avslutad. Resultatet är låst men kan fortfarande läsas.'),
(10603005, 10603, datetime('now'), 'Arkiverad', 'Dold från de vanliga vyerna och sparad enbart för historisk statistik.');
