// affinia-core.js
// 診断ロジック、UI制御、ページ初期化、共通レンダリング

(function () {
    // --- State Management ---
    const state = {
        answers: {}, // { questionId: value }
        currentQuestionIndex: 0,
        totalQuestions: 0,
        diagnosisResult: null
    };

    // --- DOM Elements ---
    const elements = {
        app: document.getElementById('app'), // Main container if needed
        questionContainer: document.getElementById('question-container'),
        progressBar: document.getElementById('progress-bar-fill'),
        questionText: document.getElementById('question-text'),
        optionsContainer: document.getElementById('options-container'),
        questionCounter: document.getElementById('question-counter'),
        startScreen: document.getElementById('start-screen'),
        diagnosisScreen: document.getElementById('diagnosis-screen')
    };

    // --- Constants ---
    const TYPE_MAPPING = {
        "ISTJ": { E: -1, S: 1, T: 1, J: 1 },
        "ISFJ": { E: -1, S: 1, T: -1, J: 1 },
        "INFJ": { E: -1, S: -1, T: -1, J: 1 },
        "INTJ": { E: -1, S: -1, T: 1, J: 1 },
        "ISTP": { E: -1, S: 1, T: 1, J: -1 },
        "ISFP": { E: -1, S: 1, T: -1, J: -1 },
        "INFP": { E: -1, S: -1, T: -1, J: -1 },
        "INTP": { E: -1, S: -1, T: 1, J: -1 },
        "ESTP": { E: 1, S: 1, T: 1, J: -1 },
        "ESFP": { E: 1, S: 1, T: -1, J: -1 },
        "ENFP": { E: 1, S: -1, T: -1, J: -1 },
        "ENTP": { E: 1, S: -1, T: 1, J: -1 },
        "ESTJ": { E: 1, S: 1, T: 1, J: 1 },
        "ESFJ": { E: 1, S: 1, T: -1, J: 1 },
        "ENFJ": { E: 1, S: -1, T: -1, J: 1 },
        "ENTJ": { E: 1, S: -1, T: 1, J: 1 }
    };

    // --- Initialization ---
    window.Affinia = {
        init: function () {
            this.setupNavigation();

            // Page specific init
            if (document.getElementById('start-screen')) {
                this.initDiagnosis();
                this.renderTopMarquee();
            } else if (document.getElementById('result-page')) {
                this.renderResultPage();
            } else if (document.getElementById('about-page')) {
                this.renderAboutPage();
            } else if (document.getElementById('compatibility-page')) {
                this.renderCompatibilityPage();
            }
        },

        renderTopMarquee: function () {
            const container = document.getElementById('top-marquee');
            if (!container) return;

            const content = document.createElement('div');
            content.className = 'marquee-content';

            // Duplicate images to create seamless loop
            const types = Object.values(window.AFFINIA_TYPES_BASIC);
            // Add twice to ensure enough width for scrolling
            const allImages = [...types, ...types];

            allImages.forEach(type => {
                const img = document.createElement('img');
                img.src = type.img;
                img.alt = type.name;
                img.title = type.name;
                content.appendChild(img);
            });

            container.appendChild(content);
        },

        setupNavigation: function () {
            const menuBtn = document.getElementById('menu-btn');
            const menuOverlay = document.getElementById('menu-overlay');
            const body = document.body;

            const toggleMenu = () => {
                body.classList.toggle('menu-open');
            };

            if (menuBtn) {
                menuBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleMenu();
                });
            }

            if (menuOverlay) {
                menuOverlay.addEventListener('click', () => {
                    body.classList.remove('menu-open');
                });
            }

            // Close menu when clicking links inside
            const menuLinks = document.querySelectorAll('.side-menu a');
            menuLinks.forEach(link => {
                link.addEventListener('click', () => {
                    body.classList.remove('menu-open');
                });
            });
        },

        // --- Diagnosis Logic ---
        initDiagnosis: function () {
            state.totalQuestions = window.AFFINIA_QUESTIONS.length;
            const startBtn = document.getElementById('start-btn');
            if (startBtn) {
                startBtn.addEventListener('click', () => {
                    elements.startScreen.classList.add('hidden');
                    elements.diagnosisScreen.classList.remove('hidden');
                    this.renderQuestion();
                });
            }
        },

        renderQuestion: function () {
            const q = window.AFFINIA_QUESTIONS[state.currentQuestionIndex];
            if (!q) return;

            // Update Progress
            const progress = ((state.currentQuestionIndex) / state.totalQuestions) * 100;
            elements.progressBar.style.width = `${progress}%`;
            elements.questionCounter.textContent = `${window.AFFINIA_TEXT.questionCountLabel}${state.currentQuestionIndex + 1} / ${state.totalQuestions}`;

            // Update Text
            elements.questionText.textContent = q.text;

            // Generate Options (Likert 1-5)
            elements.optionsContainer.innerHTML = '';
            const labels = ["まったく違う", "", "", "", "とてもそう思う"];

            const optionsWrapper = document.createElement('div');
            optionsWrapper.className = 'likert-scale';

            [1, 2, 3, 4, 5].forEach((val, idx) => {
                const btn = document.createElement('button');
                btn.className = 'likert-btn';
                btn.dataset.value = val;
                btn.onclick = () => this.handleAnswer(val);

                // Add label for ends
                if (idx === 0 || idx === 4) {
                    const label = document.createElement('span');
                    label.className = 'likert-label';
                    label.textContent = labels[idx];
                    btn.appendChild(label);
                }

                optionsWrapper.appendChild(btn);
            });
            elements.optionsContainer.appendChild(optionsWrapper);

            // Animation
            elements.questionContainer.classList.remove('fade-in');
            void elements.questionContainer.offsetWidth; // trigger reflow
            elements.questionContainer.classList.add('fade-in');
        },

        handleAnswer: function (value) {
            const q = window.AFFINIA_QUESTIONS[state.currentQuestionIndex];
            state.answers[q.id] = value;

            state.currentQuestionIndex++;
            if (state.currentQuestionIndex < state.totalQuestions) {
                setTimeout(() => this.renderQuestion(), 300); // Slight delay for UX
            } else {
                this.finishDiagnosis();
            }
        },

        finishDiagnosis: function () {
            const resultType = this.calculateResult();
            sessionStorage.setItem('affinia_result', resultType);
            window.location.href = 'result.html';
        },

        calculateResult: function () {
            let scores = { E: 0, S: 0, T: 0, J: 0 };

            window.AFFINIA_QUESTIONS.forEach(q => {
                const ans = state.answers[q.id]; // 1-5
                // 3 is neutral (0). 1,2 are negative. 4,5 are positive.
                // factor: 1 (Agree=Left), -1 (Agree=Right)
                // If factor 1: 5->+2, 4->+1, 3->0, 2->-1, 1->-2
                // If factor -1: 5->-2, 4->-1, 3->0, 2->+1, 1->+2

                const weight = (ans - 3) * q.factor;

                if (q.axis.includes('E')) scores.E += weight;
                if (q.axis.includes('S')) scores.S += weight;
                if (q.axis.includes('T')) scores.T += weight;
                if (q.axis.includes('J')) scores.J += weight;
            });

            const type = [
                scores.E >= 0 ? 'E' : 'I',
                scores.S >= 0 ? 'S' : 'N',
                scores.T >= 0 ? 'T' : 'F',
                scores.J >= 0 ? 'J' : 'P'
            ].join('');

            return type;
        },

        // --- Result Page Rendering ---
        renderResultPage: function () {
            const typeId = sessionStorage.getItem('affinia_result');
            if (!typeId) {
                window.location.href = 'index.html';
                return;
            }

            const basic = window.AFFINIA_TYPES_BASIC[typeId];
            const detail = window.AFFINIA_TYPES_DETAIL[typeId];

            // Update Header
            document.getElementById('result-type-name').textContent = basic.name;
            document.getElementById('result-catchphrase').textContent = basic.catchphrase;
            document.getElementById('result-img').src = basic.img;
            document.getElementById('result-desc').textContent = basic.desc;

            // Render Accordion
            this.renderAccordion('result-accordion', detail);

            // Setup Share Links
            this.setupShareLinks(typeId, basic.name);
        },

        renderAccordion: function (containerId, detailData) {
            const container = document.getElementById(containerId);
            if (!container) return;

            const sections = [
                { key: 'basic_trait', title: '基本性格' },
                { key: 'strength', title: '強み' },
                { key: 'weakness', title: '弱み' },
                { key: 'work_style', title: '仕事のスタイル' },
                { key: 'love_style', title: '恋愛のスタイル' }
            ];

            sections.forEach(sec => {
                const item = document.createElement('div');
                item.className = 'accordion-item';

                const header = document.createElement('button');
                header.className = 'accordion-header';
                header.innerHTML = `<span>${sec.title}</span><span class="icon">+</span>`;

                const content = document.createElement('div');
                content.className = 'accordion-content';
                content.innerHTML = `<p>${detailData[sec.key]}</p>`;

                // Close button inside content
                const closeBtn = document.createElement('button');
                closeBtn.className = 'accordion-close-btn';
                closeBtn.textContent = '閉じる';
                closeBtn.onclick = (e) => {
                    e.stopPropagation();
                    item.classList.remove('active');
                };
                content.appendChild(closeBtn);

                header.onclick = () => {
                    item.classList.toggle('active');
                };

                item.appendChild(header);
                item.appendChild(content);
                container.appendChild(item);
            });
        },

        setupShareLinks: function (typeId, typeName) {
            const url = window.location.href;
            const text = `私のAffiniaタイプは【${typeName}】でした！あなたも診断してみて？ #Affiniaタイプ診断`;

            // X (Twitter)
            const shareX = document.getElementById('share-x');
            if (shareX) shareX.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;

            // LINE
            const shareLine = document.getElementById('share-line');
            if (shareLine) shareLine.href = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`;

            // Facebook
            const shareFb = document.getElementById('share-fb');
            if (shareFb) shareFb.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

            // Instagram (Copy Link)
            const shareInsta = document.getElementById('share-insta');
            if (shareInsta) {
                shareInsta.onclick = () => {
                    this.copyToClipboard(url, 'リンクをコピーしました！Instagramでシェアしてね');
                    setTimeout(() => window.open('https://www.instagram.com/', '_blank'), 1500);
                };
            }

            // QR Code
            const shareQr = document.getElementById('share-qr');
            if (shareQr) {
                shareQr.onclick = () => {
                    this.showQrModal(url);
                };
            }

            // Copy Link
            const shareCopy = document.getElementById('share-copy');
            if (shareCopy) {
                shareCopy.onclick = () => {
                    this.copyToClipboard(url, 'リンクをコピーしました！');
                };
            }
        },

        copyToClipboard: function (text, msg) {
            navigator.clipboard.writeText(text).then(() => {
                this.showToast(msg);
            });
        },

        showToast: function (msg) {
            let toast = document.getElementById('toast');
            if (!toast) {
                toast = document.createElement('div');
                toast.id = 'toast';
                toast.className = 'toast';
                document.body.appendChild(toast);
            }
            toast.textContent = msg;
            toast.classList.remove('hidden');
            // Force reflow
            void toast.offsetWidth;
            toast.classList.add('show');

            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        },

        showQrModal: function (url) {
            // Create or reuse modal
            let modal = document.getElementById('qr-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'qr-modal';
                modal.className = 'modal';
                modal.innerHTML = `
                    <div class="modal-content text-center">
                        <span class="close-modal">&times;</span>
                        <h3 style="margin-bottom:1rem; color:var(--primary);">QRコードでシェア</h3>
                        <img id="qr-code-img" class="qr-img" src="" alt="QR Code">
                        <p style="margin-top:1rem; font-size:0.9rem; color:var(--text-light);">スマホのカメラで読み取ってください</p>
                    </div>
                `;
                document.body.appendChild(modal);
                modal.querySelector('.close-modal').onclick = () => modal.style.display = 'none';
                window.onclick = (e) => { if (e.target == modal) modal.style.display = 'none'; }
            }

            const qrImg = modal.querySelector('#qr-code-img');
            // Use Google Charts API or similar for simple QR generation
            qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;

            modal.style.display = 'block';
        },

        // --- About Page Rendering ---
        renderAboutPage: function () {
            const grid = document.getElementById('types-grid');
            if (!grid) return;

            Object.values(window.AFFINIA_TYPES_BASIC).forEach(type => {
                const card = document.createElement('div');
                card.className = 'type-card-mini';
                card.innerHTML = `
                    <div class="card-img-wrapper">
                        <img src="${type.img}" alt="${type.name}">
                    </div>
                    <h3>${type.name}</h3>
                    <p class="catchphrase">${type.catchphrase}</p>
                    <button class="detail-btn" data-id="${type.id}">詳細を見る</button>
                `;

                card.querySelector('.detail-btn').onclick = (e) => {
                    e.preventDefault();
                    this.openTypeModal(type.id);
                };

                // Make whole card clickable too
                card.onclick = (e) => {
                    if (e.target.tagName !== 'BUTTON') this.openTypeModal(type.id);
                }
                card.style.cursor = 'pointer';

                grid.appendChild(card);
            });
        },

        openTypeModal: function (typeId) {
            // Create or reuse modal
            let modal = document.getElementById('type-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'type-modal';
                modal.className = 'modal';
                modal.innerHTML = `
                    <div class="modal-content">
                        <span class="close-modal">&times;</span>
                        <div id="modal-body"></div>
                    </div>
                `;
                document.body.appendChild(modal);
                modal.querySelector('.close-modal').onclick = () => modal.style.display = 'none';
                window.onclick = (e) => { if (e.target == modal) modal.style.display = 'none'; }
            }

            const basic = window.AFFINIA_TYPES_BASIC[typeId];
            const detail = window.AFFINIA_TYPES_DETAIL[typeId];

            const body = modal.querySelector('#modal-body');
            body.innerHTML = `
                <div class="modal-header">
                    <img src="${basic.img}" class="modal-img">
                    <h2>${basic.name}</h2>
                    <p>${basic.catchphrase}</p>
                </div>
                <div id="modal-accordion"></div>
            `;

            this.renderAccordion('modal-accordion', detail);
            modal.style.display = 'block';
        },

        // --- Compatibility Page Rendering ---
        renderCompatibilityPage: function () {
            const myType = sessionStorage.getItem('affinia_result');
            const selectorContainer = document.getElementById('compat-selector');
            let currentMode = 'relation'; // 'relation' or 'ideal'

            // Setup Selectors
            const createSelect = (id, label) => {
                const wrapper = document.createElement('div');
                wrapper.className = 'select-wrapper';
                wrapper.innerHTML = `<label id="label-${id}">${label}</label>`;
                const select = document.createElement('select');
                select.id = id;
                Object.values(window.AFFINIA_TYPES_BASIC).forEach(t => {
                    const opt = document.createElement('option');
                    opt.value = t.id;
                    opt.textContent = t.name;
                    if (t.id === myType && id === 'compat-me') opt.selected = true;
                    select.appendChild(opt);
                });
                wrapper.appendChild(select);
                return wrapper;
            };

            selectorContainer.innerHTML = ''; // Clear previous
            selectorContainer.appendChild(createSelect('compat-me', 'あなたのタイプ'));
            selectorContainer.appendChild(createSelect('compat-target', '相手のタイプ'));

            const btn = document.createElement('button');
            btn.id = 'compat-action-btn';
            btn.textContent = '相性を診断する';
            btn.className = 'btn-primary';
            btn.onclick = () => this.showCompatibility(currentMode);
            selectorContainer.appendChild(btn);

            // Tab Handling
            const tabRelation = document.getElementById('tab-relation');
            const tabIdeal = document.getElementById('tab-ideal');
            const labelTarget = document.getElementById('label-compat-target');

            const switchTab = (mode) => {
                currentMode = mode;
                document.getElementById('compat-result').classList.add('hidden'); // Hide result on switch

                if (mode === 'relation') {
                    tabRelation.classList.add('active');
                    tabIdeal.classList.remove('active');
                    labelTarget.textContent = '相手のタイプ';
                    btn.textContent = '相性を診断する';
                } else {
                    tabRelation.classList.remove('active');
                    tabIdeal.classList.add('active');
                    labelTarget.textContent = 'なりたいタイプ';
                    btn.textContent = '変身方法を見る';
                }
            };

            if (tabRelation && tabIdeal) {
                tabRelation.onclick = () => switchTab('relation');
                tabIdeal.onclick = () => switchTab('ideal');
            }
        },

        showCompatibility: function (mode) {
            const me = document.getElementById('compat-me').value;
            const target = document.getElementById('compat-target').value;
            const resultContainer = document.getElementById('compat-result');

            if (mode === 'ideal') {
                this.showTransformation(me, target, resultContainer);
                return;
            }

            // Relation Mode (Dynamic Logic)
            const result = window.AFFINIA_COMPAT_LOGIC.calculate(me, target);

            // Render Dynamic Content
            let dynamicsHtml = '';
            result.dynamics.forEach(text => {
                dynamicsHtml += `<div class="compat-block"><p>${text}</p></div>`;
            });

            const actions = window.AFFINIA_COMPAT_ACTIONS[result.category];
            const basicMe = window.AFFINIA_TYPES_BASIC[me];
            const basicTarget = window.AFFINIA_TYPES_BASIC[target];

            resultContainer.innerHTML = `
                <div class="compat-header ${result.class}">
                    <div class="compat-pair">
                        <div class="compat-char">
                            <img src="${basicMe.img}">
                            <span>あなた</span>
                        </div>
                        <div class="compat-vs">×</div>
                        <div class="compat-char">
                            <img src="${basicTarget.img}">
                            <span>お相手</span>
                        </div>
                    </div>
                    <h2>${result.label}</h2>
                    <p class="compat-desc">${result.desc}</p>
                </div>

                <div class="compat-details" style="display:block;">
                    <h3 style="color:var(--primary); margin-bottom:1rem; text-align:center;">二人の関係性</h3>
                    <div style="display:grid; gap:1rem;">
                        ${dynamicsHtml}
                    </div>
                </div>

                <div class="action-guide">
                    <h3>行動ガイド</h3>
                    <div class="guide-grid">
                        <div class="guide-item">
                            <h4>🔰 初期接近</h4>
                            <p>${actions.approach}</p>
                        </div>
                        <div class="guide-item">
                            <h4>📅 日常の距離詰め</h4>
                            <p>${actions.daily}</p>
                        </div>
                        <div class="guide-item">
                            <h4>⚠️ NG行動</h4>
                            <p>${actions.ng}</p>
                        </div>
                        <div class="guide-item">
                            <h4>🕊️ 仲直り</h4>
                            <p>${actions.reconcile}</p>
                        </div>
                    </div>
                </div>

                <div class="share-container" style="margin-top: 2rem;">
                    <h3 class="share-title">この相性結果をシェア</h3>
                    <div class="share-buttons">
                        <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(`【${basicMe.name}】と【${basicTarget.name}】の相性は...${result.label}！ #Affinia相性診断`)}&url=${encodeURIComponent(window.location.href)}" target="_blank" class="share-btn-icon share-x" title="Xでシェア">X</a>
                        <a href="https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(window.location.href)}" target="_blank" class="share-btn-icon share-line" title="LINEでシェア">L</a>
                        <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}" target="_blank" class="share-btn-icon share-fb" title="Facebookでシェア">F</a>
                        <button onclick="window.Affinia.copyToClipboard(window.location.href, 'リンクをコピーしました！Instagramでシェアしてね'); setTimeout(()=>window.open('https://www.instagram.com/', '_blank'), 1500)" class="share-btn-icon share-insta" title="Instagramでシェア">I</button>
                        <button onclick="window.Affinia.showQrModal(window.location.href)" class="share-btn-icon share-qr" title="QRコード">Q</button>
                        <button onclick="window.Affinia.copyToClipboard(window.location.href, 'リンクをコピーしました！')" class="share-btn-icon share-copy" title="リンクをコピー">🔗</button>
                    </div>
                </div>
            `;

            resultContainer.classList.remove('hidden');
            resultContainer.scrollIntoView({ behavior: 'smooth' });
        },

        showTransformation: function (me, target, container) {
            const basicMe = window.AFFINIA_TYPES_BASIC[me];
            const basicTarget = window.AFFINIA_TYPES_BASIC[target];
            const detailTarget = window.AFFINIA_TYPES_DETAIL[target];

            const steps = window.AFFINIA_COMPAT_LOGIC.generateTransformation(me, target);

            // Axis Name Mapping
            const AXIS_NAMES = {
                'EI': '人との関わり方',
                'SN': '情報の受け取り方',
                'TF': '決断の基準',
                'PJ': '行動のペース'
            };

            let stepsHtml = '';
            if (steps && steps.length > 0) {
                steps.forEach((step, index) => {
                    const axisLabel = AXIS_NAMES[step.axis] || step.axis;
                    stepsHtml += `
                        <div class="compat-block" style="margin-bottom:1rem;">
                            <h4 style="color:var(--primary); margin-bottom:0.5rem;">STEP ${index + 1}: ${axisLabel}を変える</h4>
                            <p>${step.text}</p>
                        </div>
                    `;
                });
            } else {
                stepsHtml = '<div class="compat-block"><p>すでに同じタイプです！今の自分に自信を持ってください。</p></div>';
            }

            container.innerHTML = `
                <div class="compat-header compat-work"> <!-- Use 'work' style for growth -->
                    <div class="compat-pair">
                        <div class="compat-char">
                            <img src="${basicMe.img}">
                            <span>現在</span>
                        </div>
                        <div class="compat-vs">➡</div>
                        <div class="compat-char">
                            <img src="${basicTarget.img}">
                            <span>目標</span>
                        </div>
                    </div>
                    <h2>${basicTarget.name}になるには？</h2>
                    <p class="compat-desc">憧れの自分に近づくためのステップアップガイド</p>
                </div>

                <div class="compat-details" style="display:block;">
                     <h3 style="color:var(--primary); margin-bottom:1rem; text-align:center;">変身へのロードマップ</h3>
                     ${stepsHtml}
                </div>
                
                <div class="compat-details" style="margin-top:2rem;">
                    <div class="compat-block">
                        <h3>✨ 目指すべき姿</h3>
                        <p>${basicTarget.desc}</p>
                    </div>
                    <div class="compat-block">
                        <h3>💪 取り入れるべき強み</h3>
                        <p>${detailTarget.strength}</p>
                    </div>
                    <div class="compat-block">
                        <h3>💼 仕事での振る舞い</h3>
                        <p>${detailTarget.work_style}を意識してみましょう。</p>
                    </div>
                    <div class="compat-block">
                        <h3>❤️ マインドセット</h3>
                        <p>${basicTarget.catchphrase}のような心持ちで過ごしてみましょう。</p>
                    </div>
                </div>

                <div class="share-container" style="margin-top: 2rem;">
                    <h3 class="share-title">変身宣言をシェア！</h3>
                    <div class="share-buttons">
                        <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(`私は【${basicTarget.name}】を目指します！ #Affinia変身宣言`)}&url=${encodeURIComponent(window.location.href)}" target="_blank" class="share-btn-icon share-x" title="Xでシェア">X</a>
                        <a href="https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(window.location.href)}" target="_blank" class="share-btn-icon share-line" title="LINEでシェア">L</a>
                        <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}" target="_blank" class="share-btn-icon share-fb" title="Facebookでシェア">F</a>
                        <button onclick="window.Affinia.copyToClipboard(window.location.href, 'リンクをコピーしました！')" class="share-btn-icon share-copy" title="リンクをコピー">🔗</button>
                    </div>
                </div>
            `;

            container.classList.remove('hidden');
            container.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Auto-init on load
    document.addEventListener('DOMContentLoaded', () => {
        window.Affinia.init();
    });

})();
