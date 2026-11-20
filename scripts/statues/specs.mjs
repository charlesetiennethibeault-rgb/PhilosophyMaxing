// Statues du créateur de chaque philosophie, pour l'onglet « Comparer ».
// Chaque entrée : [id de la philosophie, symbolique ?, [[requête Wikimedia Commons, qui est représenté, filtre (regex sur titre + description)], …]]
// Les requêtes sont essayées dans l'ordre. `symbolique` = pas de créateur unique : on montre une figure ou une sculpture
// qui représente la tradition, et la légende le dit clairement.
export const SPECS = [
  // Antiquité gréco-romaine
  ['presocratiques', false, [['Thales of Miletus bust', 'Thalès de Milet', 'thales'], ['Heraclitus bust marble', 'Héraclite', 'heraclit'], ['Parmenides bust', 'Parménide', 'parmenid']]],
  ['sophistes', false, [['cat:Protagoras', 'Protagoras', 'protagoras'], ['Protagoras statue Abdera', 'Protagoras', 'protagoras'], ['Gorgias bust', 'Gorgias', 'gorgias']]],
  ['platonisme', false, [['Plato bust marble', 'Platon', 'plato'], ['Plato portrait herm', 'Platon', 'plato']]],
  ['aristotelisme', false, [['Aristotle bust marble Altemps', 'Aristote', 'aristotle'], ['Aristotle statue', 'Aristote', 'aristotle']]],
  ['cynisme', false, [['Diogenes of Sinope statue', 'Diogène de Sinope', 'diogenes'], ['Diogenes marble statue', 'Diogène de Sinope', 'diogenes'], ['Antisthenes bust', 'Antisthène', 'antisthen']]],
  ['hedonisme-cyrenaique', false, [['cat:Aristippus', 'Aristippe de Cyrène', 'aristipp'], ['Aristippus bust', 'Aristippe de Cyrène', 'aristipp'], ['Aristippus statue', 'Aristippe de Cyrène', 'aristipp']]],
  ['epicurisme', false, [['Epicurus bust marble', 'Épicure', 'epicur'], ['Epicurus portrait statue', 'Épicure', 'epicur']]],
  ['stoicisme', false, [['Zeno of Citium bust', 'Zénon de Kition', 'zeno'], ['Chrysippus bust', 'Chrysippe', 'chrysipp'], ['Seneca bust marble', 'Sénèque', 'seneca']]],
  ['pyrrhonisme-scepticisme', false, [['Pyrrho bust', 'Pyrrhon d’Élis', 'pyrrho'], ['Pyrrho statue Elis', 'Pyrrhon d’Élis', 'pyrrho']]],
  ['neoplatonisme', false, [['Plotinus bust Ostia', 'Plotin', 'plotin'], ['Plotinus portrait', 'Plotin', 'plotin']]],

  // Inde et bouddhismes
  ['bouddhisme-des-origines-theravada', false, [['Buddha statue stone Gandhara', 'le Bouddha', 'buddha'], ['Buddha head stone sculpture', 'le Bouddha', 'buddha'], ['Seated Buddha sandstone Sarnath', 'le Bouddha', 'buddha']]],
  ['madhyamaka-nagarjuna', false, [['Nagarjuna statue', 'Nagarjuna', 'nagarjun'], ['Nagarjuna sculpture stone', 'Nagarjuna', 'nagarjun']]],
  ['vedanta-advaita', false, [['Adi Shankara statue', 'Śaṅkara', 'shankar|sankar'], ['Adi Shankaracharya statue stone', 'Śaṅkara', 'shankar|sankar']]],
  ['jainisme', false, [['Mahavira statue', 'Mahavira', 'mahavir'], ['Mahavira marble statue Jain', 'Mahavira', 'mahavir'], ['Tirthankara statue stone', 'un Tirthankara jaïn', 'tirthankar']]],
  ['charvaka-materialisme-indien', true, [['Brihaspati statue', 'Brihaspati, maître légendaire', 'brihaspati|brhaspati'], ['Brihaspati sculpture stone', 'Brihaspati, maître légendaire', 'brihaspati|brhaspati']]],
  ['samkhya-et-yoga', false, [['Patanjali statue', 'Patañjali', 'patanjali'], ['Kapila sage statue', 'Kapila', 'kapila']]],
  ['nyaya-vaisesika', true, [['Kanada sage statue', 'Kaṇāda', 'kanada'], ['Gautama Akshapada statue', 'Akṣapāda Gautama', 'akshapada|gautama'], ['Indian sage stone sculpture ancient', 'un sage indien', 'sage|rishi|muni']]],
  ['yogacara', false, [['cat:Vasubandhu', 'Vasubandhu', 'vasubandhu|seshin'], ['Vasubandhu statue Kofuku-ji', 'Vasubandhu', 'vasubandhu|seshin'], ['Asanga statue Kofuku-ji', 'Asaṅga', 'asanga|muchaku']]],
  ['bouddhisme-tibetain', true, [['Padmasambhava statue', 'Padmasambhava', 'padmasambhava|guru rinpoche'], ['Tsongkhapa statue', 'Tsongkhapa', 'tsongkhapa|tsong kha pa'], ['Milarepa statue', 'Milarepa', 'milarepa']]],
  ['ajivika-fatalisme', true, [['Makkhali Gosala', 'Makkhali Gosāla', 'gosala|goshala|gosāla'], ['ascetic sculpture ancient India stone', 'un ascète indien', 'ascetic|sadhu|muni']]],
  ['pensee-indienne-moderne-gandhi-tagore-ambedkar', false, [['Gandhi statue stone', 'Gandhi', 'gandhi'], ['Rabindranath Tagore bust', 'Tagore', 'tagore'], ['Ambedkar statue', 'Ambedkar', 'ambedkar']]],

  // Asie de l'Est et du Sud-Est
  ['confucianisme', false, [['cat:Statues of Confucius', 'Confucius', 'confucius|kongzi'], ['Confucius statue stone', 'Confucius', 'confucius'], ['Confucius stone statue temple', 'Confucius', 'confucius']]],
  ['taoisme', false, [['Laojun Rock Quanzhou', 'Laozi', 'laojun|laozi|lao zi|lao tzu'], ['Laozi stone statue', 'Laozi', 'laozi|lao zi|lao tzu|laotze']]],
  ['mohisme', false, [['Mozi statue', 'Mozi', 'mozi|mo zi|mo tzu'], ['Mo Di statue Tengzhou', 'Mozi', 'mozi|mo di|mo zi']]],
  ['legisme', false, [['cat:Shang Yang', 'Shang Yang', 'shang yang'], ['Shang Yang statue', 'Shang Yang', 'shang yang'], ['Han Fei statue', 'Han Fei', 'han fei']]],
  ['zen', true, [['cat:Statues of Bodhidharma', 'Bodhidharma', 'bodhidharma|daruma|damo'], ['Bodhidharma statue stone', 'Bodhidharma', 'bodhidharma|daruma|damo'], ['Bodhidharma statue Shaolin', 'Bodhidharma', 'bodhidharma|damo']]],
  ['mencius', false, [['Mencius statue', 'Mencius', 'mencius|mengzi|meng zi'], ['Mencius stone statue Zoucheng', 'Mencius', 'mencius|mengzi']]],
  ['xunzi', false, [['cat:Xunzi', 'Xunzi', 'xunzi|xun zi'], ['Xunzi statue', 'Xunzi', 'xunzi|xun zi|hsun'], ['Xun Kuang statue', 'Xunzi', 'xun kuang|xunzi']]],
  ['neo-confucianisme-zhu-xi-avec-yi-hwang-en-coree', false, [['Zhu Xi statue', 'Zhu Xi', 'zhu xi|chu hsi'], ['Yi Hwang statue Toegye', 'Yi Hwang (Toegye)', 'toegye|yi hwang']]],
  ['wang-yangming', false, [['Wang Yangming statue', 'Wang Yangming', 'wang yangming|wang shouren|yangming'], ['Wang Yangming stone statue Guiyang', 'Wang Yangming', 'wang yangming|yangming']]],
  ['ecole-de-kyoto', false, [['Nishida Kitaro statue', 'Nishida Kitarō', 'nishida'], ['Nishida Kitaro monument', 'Nishida Kitarō', 'nishida']]],
  ['bushido', true, [['samurai stone statue', 'un samouraï', 'samurai'], ['Miyamoto Musashi statue', 'Miyamoto Musashi', 'musashi'], ['Kusunoki Masashige statue', 'Kusunoki Masashige', 'kusunoki']]],
  ['bouddhisme-engage', false, [['Thich Quang Duc statue', 'Thích Quảng Đức', 'quang duc|quảng đức'], ['Thich Nhat Hanh statue', 'Thích Nhất Hạnh', 'nhat hanh']]],
  ['kapwa-philippines', true, [['Jose Rizal monument stone', 'José Rizal', 'rizal'], ['Philippines stone sculpture statue', 'une sculpture philippine', 'philippin']]],

  // Traditions religieuses et monde arabo-perse
  ['philosophie-islamique-classique-et-soufisme', false, [['Avicenna statue', 'Avicenne', 'avicenna|ibn sina'], ['Al-Farabi monument', 'Al-Fārābī', 'farabi'], ['Averroes statue', 'Averroès', 'averroes|ibn rushd']]],
  ['sagesse-juive-maimonide-ecclesiaste', false, [['Maimonides statue', 'Maïmonide', 'maimonid'], ['Maimonides monument Cordoba', 'Maïmonide', 'maimonid']]],
  ['scolastique-chretienne-augustin-thomas-d-aquin', true, [['Thomas Aquinas statue stone', 'Thomas d’Aquin', 'aquinas|aquin'], ['Saint Augustine statue stone', 'Augustin d’Hippone', 'augustine|augustin']]],
  ['gnosticisme', true, [['Sophia statue Library of Celsus', 'Sophia, la Sagesse (figure gnostique)', 'sophia'], ['Abraxas gnostic stone', 'Abraxas gnostique', 'abraxas']]],
  ['ibn-khaldun', false, [['cat:Ibn Khaldun', 'Ibn Khaldūn', 'khaldun|khaldoun'], ['Ibn Khaldun statue Tunis', 'Ibn Khaldūn', 'khaldun|khaldoun'], ['Ibn Khaldun monument', 'Ibn Khaldūn', 'khaldun|khaldoun']]],
  ['illuminationisme-persan', true, [['Suhrawardi statue', 'Sohravardī', 'suhraward|sohraward'], ['Mulla Sadra statue', 'Mullā Ṣadrā', 'mulla sadra|mulla-sadra'], ['Persian stone statue sage', 'un sage persan', 'persian|iranian']]],
  ['mu-tazilisme', true, [['Wasil ibn Ata', 'Wāṣil ibn ʿAṭāʾ', 'wasil'], ['Al-Jahiz statue', 'Al-Jāḥiẓ', 'jahiz|jahith'], ['Abbasid Baghdad stone sculpture', 'sculpture abbasside', 'abbasid']]],
  ['zoroastrisme-et-manicheisme', false, [['Zoroaster statue', 'Zarathoustra', 'zoroast|zarathustra'], ['Zoroaster stone relief statue Yazd', 'Zarathoustra', 'zoroast|zarathustra'], ['Mani manichaeism statue', 'Mani', 'mani']]],

  // Afrique
  ['ubuntu', true, [['Desmond Tutu statue', 'Desmond Tutu', 'tutu'], ['Nelson Mandela statue stone', 'Nelson Mandela', 'mandela']]],
  ['philosophie-akan', true, [['Kwame Nkrumah statue', 'Kwame Nkrumah', 'nkrumah'], ['Ashanti stone sculpture', 'une sculpture ashanti', 'ashanti|asante|akan']]],
  ['philosophie-yoruba-ifa-ori', true, [['Esie soapstone figures', 'statues d’Esie (pierre, Yoruba)', 'esie'], ['Opa Oranmiyan Ife stone', 'Opa Oranmiyan, Ife', 'oranmiyan|ife']]],
  ['maat-egypte-ancienne', true, [['cat:Statues of Maat', 'Maât, déesse égyptienne', 'maat|ma.at'], ['Maat goddess statue', 'Maât, déesse égyptienne', 'maat|ma.at'], ['Ptahhotep statue', 'Ptahhotep', 'ptahhotep']]],
  ['zera-yacob-ethiopie', true, [['Zara Yaqob statue', 'Zera Yacob', 'zara yaqob|zera yacob|zar.a ya.qob'], ['Ethiopia stone statue ancient', 'une statue éthiopienne ancienne', 'ethiopia|aksum|axum']]],
  ['negritude-et-panafricanisme', false, [['Aime Cesaire statue', 'Aimé Césaire', 'cesaire|césaire'], ['Leopold Sedar Senghor statue', 'Léopold Sédar Senghor', 'senghor']]],

  // Amériques et Océanie
  ['visions-du-monde-autochtones-d-amerique-du-nord', true, [['Birger figurine Cahokia', 'figurine de Birger (Cahokia, pierre)', 'birger|cahokia'], ['Mississippian stone statue', 'statue mississippienne en pierre', 'mississippian']]],
  ['philosophie-nahua-azteque', true, [['Nezahualcoyotl statue', 'Nezahualcóyotl', 'nezahualc'], ['Xochipilli statue Aztec stone', 'Xochipilli (sculpture aztèque)', 'xochipilli'], ['Aztec stone sculpture', 'sculpture aztèque', 'aztec']]],
  ['philosophies-andines-buen-vivir', true, [['Tiwanaku monolith stone', 'monolithe de Tiwanaku', 'tiwanaku|tiahuanaco'], ['Pachamama stone statue', 'Pachamama', 'pachamama']]],
  ['pensee-inuite', true, [['Inuksuk stone', 'un inuksuk', 'inuksuk|inukshuk|inuksuit'], ['Inukshuk', 'un inuksuk', 'inukshuk|inuksuk']]],
  ['philosophie-de-la-liberation-et-pensee-decoloniale', true, [['Paulo Freire statue', 'Paulo Freire', 'freire'], ['Leopoldo Zea', 'Leopoldo Zea', 'leopoldo zea']]],
  ['temps-du-reve-aborigene', true, [['Aboriginal stone sculpture Dreaming', 'sculpture aborigène', 'aborigin'], ['Rainbow Serpent sculpture', 'le Serpent arc-en-ciel', 'rainbow serpent']]],
  ['vision-maorie-whakapapa', true, [['Maori stone carving pounamu tiki', 'tiki maori en pierre', 'maori|māori'], ['Maori stone statue', 'statue maorie en pierre', 'maori|māori']]],

  // Moderne
  ['humanisme-de-la-renaissance', false, [['Petrarch statue', 'Pétrarque', 'petrarc'], ['Erasmus statue', 'Érasme', 'erasmus'], ['Montaigne statue', 'Montaigne', 'montaigne']]],
  ['realisme-politique-machiavel-hobbes', false, [['Machiavelli statue Uffizi', 'Machiavel', 'machiavel'], ['Niccolo Machiavelli bust', 'Machiavel', 'machiavel']]],
  ['rationalisme', false, [['Descartes statue', 'Descartes', 'descartes'], ['Rene Descartes bust marble', 'Descartes', 'descartes']]],
  ['spinozisme', false, [['Spinoza statue', 'Spinoza', 'spinoza'], ['Baruch Spinoza bust', 'Spinoza', 'spinoza']]],
  ['empirisme', false, [['David Hume statue Edinburgh', 'David Hume', 'hume'], ['John Locke statue', 'John Locke', 'locke'], ['George Berkeley statue', 'George Berkeley', 'berkeley']]],
  ['lumieres', true, [['cat:Statues of Voltaire', 'Voltaire', 'voltaire'], ['Voltaire statue Houdon', 'Voltaire', 'voltaire'], ['Voltaire marble statue', 'Voltaire', 'voltaire'], ['Diderot statue', 'Diderot', 'diderot']]],
  ['kantisme', false, [['Immanuel Kant statue', 'Emmanuel Kant', 'kant'], ['Immanuel Kant bust marble', 'Emmanuel Kant', 'kant']]],
  ['utilitarisme', false, [['Jeremy Bentham statue', 'Jeremy Bentham', 'bentham'], ['John Stuart Mill statue', 'John Stuart Mill', 'stuart mill|j\\. s\\. mill']]],
  ['liberalisme-politique-locke-rawls', false, [['John Locke statue', 'John Locke', 'locke'], ['John Locke bust', 'John Locke', 'locke'], ['Montesquieu statue', 'Montesquieu', 'montesquieu']]],

  // XIXe et XXe siècles
  ['idealisme-allemand-hegel', true, [['Hegel bust', 'Hegel', 'hegel'], ['Hegel statue', 'Hegel', 'hegel'], ['Fichte bust', 'Fichte', 'fichte']]],
  ['romantisme', true, [['Herder statue Weimar', 'Johann Gottfried Herder', 'herder'], ['Novalis statue', 'Novalis', 'novalis'], ['Friedrich Schiller statue', 'Friedrich Schiller', 'schiller']]],
  ['pessimisme-de-schopenhauer', false, [['cat:Arthur Schopenhauer', 'Arthur Schopenhauer', 'schopenhauer'], ['Schopenhauer bust', 'Arthur Schopenhauer', 'schopenhauer'], ['Schopenhauer statue', 'Arthur Schopenhauer', 'schopenhauer']]],
  ['kierkegaard', false, [['cat:Søren Kierkegaard', 'Søren Kierkegaard', 'kierkegaard'], ['Kierkegaard statue', 'Søren Kierkegaard', 'kierkegaard'], ['Soren Kierkegaard bust', 'Søren Kierkegaard', 'kierkegaard']]],
  ['marxisme', false, [['Karl Marx statue', 'Karl Marx', 'marx'], ['Karl Marx bust', 'Karl Marx', 'marx'], ['Friedrich Engels statue', 'Friedrich Engels', 'engels']]],
  ['pragmatisme', false, [['William James bust', 'William James', 'william james'], ['John Dewey statue', 'John Dewey', 'dewey'], ['Charles Sanders Peirce', 'Charles S. Peirce', 'peirce']]],
  ['nietzsche', false, [['Nietzsche bust', 'Friedrich Nietzsche', 'nietzsche'], ['Nietzsche statue', 'Friedrich Nietzsche', 'nietzsche']]],
  ['bergson-et-philosophie-du-processus', false, [['Henri Bergson bust', 'Henri Bergson', 'bergson'], ['Bergson statue', 'Henri Bergson', 'bergson']]],
  ['phenomenologie', false, [['Edmund Husserl bust', 'Edmund Husserl', 'husserl'], ['Heidegger bust statue', 'Martin Heidegger', 'heidegger']]],
  ['existentialisme', false, [['Jean-Paul Sartre statue', 'Jean-Paul Sartre', 'sartre'], ['Jean-Paul Sartre bust', 'Jean-Paul Sartre', 'sartre'], ['Simone de Beauvoir statue', 'Simone de Beauvoir', 'beauvoir']]],
  ['absurdisme', false, [['Albert Camus statue', 'Albert Camus', 'camus'], ['Albert Camus bust', 'Albert Camus', 'camus']]],
  ['philosophie-analytique-wittgenstein', true, [['Wittgenstein statue', 'Ludwig Wittgenstein', 'wittgenstein'], ['Bertrand Russell statue bust', 'Bertrand Russell', 'russell'], ['Gottlob Frege bust', 'Gottlob Frege', 'frege']]],
  ['structuralisme-et-postmodernisme', true, [['Michel Foucault bust statue', 'Michel Foucault', 'foucault'], ['Claude Levi-Strauss bust', 'Claude Lévi-Strauss', 'levi-strauss|lévi-strauss'], ['Jacques Derrida statue', 'Jacques Derrida', 'derrida']]],
  ['psychanalyse-freud-jung', false, [['Sigmund Freud bust marble', 'Sigmund Freud', 'freud'], ['Sigmund Freud statue', 'Sigmund Freud', 'freud'], ['Carl Jung statue bust', 'Carl Gustav Jung', 'jung']]],
  ['ethique-de-l-alterite-levinas-buber', true, [['Emmanuel Levinas bust statue', 'Emmanuel Levinas', 'levinas'], ['Martin Buber statue bust', 'Martin Buber', 'buber']]],
  ['anarchisme', false, [['Proudhon statue', 'Pierre-Joseph Proudhon', 'proudhon'], ['Bakunin statue', 'Mikhaïl Bakounine', 'bakunin'], ['Kropotkin bust statue', 'Pierre Kropotkine', 'kropotkin']]],

  // Contemporain et modes de vie
  ['feminisme-et-ethique-du-care', true, [['Mary Wollstonecraft statue', 'Mary Wollstonecraft', 'wollstonecraft'], ['Olympe de Gouges statue', 'Olympe de Gouges', 'gouges'], ['Simone de Beauvoir bust', 'Simone de Beauvoir', 'beauvoir']]],
  ['ecologie-profonde', false, [['Arne Naess statue bust', 'Arne Næss', 'naess|næss'], ['Henry David Thoreau statue', 'Henry David Thoreau', 'thoreau'], ['John Muir statue', 'John Muir', 'muir']]],
  ['transhumanisme', true, [['Prometheus statue marble', 'Prométhée', 'prometheus'], ['Prometheus stone sculpture', 'Prométhée', 'prometheus']]],
  ['altruisme-efficace', true, [['Charity allegory marble statue', 'la Charité (allégorie)', 'charity|caritas'], ['Good Samaritan stone sculpture', 'le Bon Samaritain', 'samaritan']]],
  ['wabi-sabi', false, [['Sen no Rikyu statue', 'Sen no Rikyū', 'rikyu|rikyū'], ['Sen no Rikyu bust monument', 'Sen no Rikyū', 'rikyu|rikyū'], ['Okakura Kakuzo', 'Okakura Kakuzō', 'okakura']]],
  ['minimalisme', true, [['Brancusi The Kiss Montparnasse', 'Le Baiser de Brâncuși (pierre)', 'brancusi|brâncuși|kiss'], ['Brancusi sculpture stone', 'sculpture de Brâncuși', 'brancusi|brâncuși']]],
  ['philosophie-de-l-esprit-dualisme-physicalisme-panpsychisme', true, [['The Thinker Rodin', 'Le Penseur de Rodin', 'thinker|penseur'], ['Descartes statue', 'Descartes', 'descartes']]],
]
