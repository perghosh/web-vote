INSERT INTO "TCode" (
    "CodeK"
   ,"CodeGroupK"
   ,"CreatedD"
   ,"FName"
   ,"FDescription"
) VALUES 
(10601000, 10601, datetime('now'), 'Politik & Samhällsstyrning', 'Frågor om demokrati, lag och rätt, myndigheter samt internationella relationer.'),
(10601001, 10601, datetime('now'), 'Ekonomi & Näringsliv', 'Frågor om skatter, arbetsmarknad, företagande och infrastruktur.'),
(10601002, 10601, datetime('now'), 'Välfärd & Omsorg', 'Frågor om sjukvård, äldreomsorg, socialtjänst och folkhälsa.'),
(10601003, 10601, datetime('now'), 'Utbildning & Forskning', 'Frågor om förskola, skola, högre utbildning och vetenskapliga anslag.'),
(10601004, 10601, datetime('now'), 'Miljö, Klimat & Energi', 'Frågor om klimatpolitik, energikällor, naturvård och återvinning.'),
(10601005, 10601, datetime('now'), 'Digitalisering & Teknik (IT)', 'Frågor om integritet, dataskydd, AI-etik, 5G och cybersäkerhet.'),
(10601006, 10601, datetime('now'), 'Kultur, Fritid & Samfund', 'Frågor om idrott, föreningsliv, konst, media och trossamfund.'),
(10601007, 10601, datetime('now'), 'Tyck till!', 'Allmänna, enkla och snabba frågor med enbart Ja/Nej som svarsalternativ.'),
(10601008, 10601, datetime('now'), 'Konspirationer', 'Frågor om dolda sanningar, alternativa teorier och historiska frågtecken.'),
(10601009, 10601, datetime('now'), 'Livsstil', 'Frågor om vardagsliv, konsumtion, mat, trender och mode.'),
(10601010, 10601, datetime('now'), 'Relationer', 'Frågor om mänskligt beteende, dejting, familjeliv och moraliska dilemman.'),
(10601011, 10601, datetime('now'), 'Underhållning', 'Frågor om gaming, streamingtjänster, influencers och popkultur.'),
(10601012, 10601, datetime('now'), 'Politiska Partier', 'Frågor om partiprogram, ideologier, regeringsbildning och specifika partiledare.'),
(10601013, 10601, datetime('now'), 'Medier, Nyheter & Aktualiteter', 'Frågor om nyhetsrapportering, pressetik, journalistik samt det aktuella medielandskapet och omvärldshändelser.'),
(10601014, 10601, datetime('now'), 'Övrigt', 'För frågor och ämnen som inte passar in i någon av de andra specifika kategorierna.');



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
