export interface SiteCtx {
  site: HTMLElement;
  mistake(msg: string): void;
  complete(): void;
  later(fn: () => void, ms: number): void;
  every(fn: () => void, ms: number): void;
}

export interface Level {
  brand: string;
  domain: string;
  task: string;
  pattern: string;
  explain: string;
  render(ctx: SiteCtx): void;
}

const money = (n: number) => `$${n.toFixed(2)}`;

function q<T extends HTMLElement = HTMLElement>(root: HTMLElement, sel: string): T {
  return root.querySelector(sel) as T;
}
function qa<T extends HTMLElement = HTMLElement>(root: HTMLElement, sel: string): T[] {
  return [...root.querySelectorAll<T>(sel)];
}
function on(root: HTMLElement, sel: string, fn: (e: Event) => void): void {
  qa(root, sel).forEach((n) => n.addEventListener('click', fn));
}

export const LEVELS: Level[] = [
  {
    brand: 'GlowLeaf Plants',
    domain: 'glowleaf.fake',
    task: 'Close the pop-up without joining the newsletter.',
    pattern: 'Confirmshaming',
    explain:
      'The "no" option was written to make you feel silly for picking it. Sites do this so saying no feels worse than saying yes. You are allowed to say no without feeling bad.',
    render({ site, mistake, complete }) {
      site.innerHTML = `
        <div class="s-glow">
          <header class="s-bar"><b>🌿 GlowLeaf</b><span>Plants · Pots · Soil</span></header>
          <div class="s-hero"><p class="s-h">Fresh plants for sleepy rooms</p><p>Our ferns are very calm. Our cacti are a little prickly.</p></div>
          <div class="s-overlay">
            <div class="s-modal s-modal--glow" role="dialog" aria-label="Newsletter offer">
              <button type="button" class="s-x s-x--tiny" data-x aria-label="Close">×</button>
              <p class="s-h">Get 10% off your first plant!</p>
              <p>Join 🌱 Leafy Letters and never miss a sale.</p>
              <label class="s-lab">Email<input class="s-in" type="email" placeholder="you@example.com" autocomplete="off"></label>
              <button type="button" class="s-btn s-btn--green s-btn--wide" data-yes>Yes, save me money!</button>
              <button type="button" class="s-link s-link--faint" data-no>No thanks, I like paying full price and my plants are sad.</button>
            </div>
          </div>
        </div>`;
      on(site, '[data-yes]', () => mistake('You joined Leafy Letters. Expect three emails a day about soil.'));
      on(site, '[data-no], [data-x]', () => complete());
    },
  },
  {
    brand: 'Daily Waffle',
    domain: 'dailywaffle.fake',
    task: 'Read the article without allowing any optional cookies.',
    pattern: 'Pre-ticked Boxes',
    explain:
      'The extra cookie settings were already switched on, and the big bright button accepted everything. Choosing less took more clicks and smaller buttons. That is called preselection: the site picks for you and hopes you do not look.',
    render({ site, mistake, complete }) {
      const draw = () => {
        site.innerHTML = `
          <div class="s-news">
            <header class="s-bar s-bar--news"><b>The Daily Waffle</b><span>News you can pour syrup on</span></header>
            <article class="s-article"><p class="s-h">Local duck learns to use revolving door</p><p>Witnesses say the duck went around four times before choosing to leave.</p></article>
            <div class="s-cookie" role="dialog" aria-label="Cookie settings">
              <p><b>🍪 We value your privacy!</b> We and our partners use cookies to make your experience more delicious.</p>
              <div class="s-row">
                <button type="button" class="s-link s-link--faint" data-manage>Manage settings</button>
                <button type="button" class="s-btn s-btn--green" data-accept>Accept all</button>
              </div>
            </div>
          </div>`;
        on(site, '[data-accept]', () => mistake('Every partner can now track you. All of them.'));
        on(site, '[data-manage]', manage);
      };
      const manage = () => {
        const box = q(site, '.s-cookie');
        box.innerHTML = `
          <p><b>Cookie settings</b></p>
          <ul class="s-toggles">
            <li><span>Needed to run the site</span><input type="checkbox" checked disabled aria-label="Needed cookies, always on"></li>
            <li><label for="ck-a">Analytics</label><input id="ck-a" type="checkbox" checked data-opt="Analytics"></li>
            <li><label for="ck-b">Personalized ads</label><input id="ck-b" type="checkbox" checked data-opt="Personalized ads"></li>
            <li><label for="ck-c">Share with lots of partners</label><input id="ck-c" type="checkbox" checked data-opt="Partner sharing"></li>
          </ul>
          <div class="s-row">
            <button type="button" class="s-link s-link--faint" data-save>Save my choices</button>
            <button type="button" class="s-btn s-btn--green" data-accept>Accept all</button>
          </div>`;
        on(box, '[data-accept]', () => {
          mistake('Accept all means accept all. Back to the start!');
          draw();
        });
        on(box, '[data-save]', () => {
          const left = qa<HTMLInputElement>(box, '[data-opt]').filter((c) => c.checked);
          if (left.length) mistake(`Still switched on: ${left.map((c) => c.dataset.opt).join(', ')}.`);
          else complete();
        });
      };
      draw();
    },
  },
  {
    brand: 'FreeDoodle',
    domain: 'freedoodle.fake',
    task: 'Download the file doodle-pack.zip.',
    pattern: 'Disguised Ads',
    explain:
      'The giant download buttons were ads dressed up to look like part of the page. The real link was small and plain. Before you click, look for the actual file name and tiny "Ad" labels.',
    render({ site, mistake, complete }) {
      const ad = (cls: string, text: string) =>
        `<div class="s-ad ${cls}"><span class="s-adtag">Ad</span><button type="button" class="s-dl" data-ad>${text}</button></div>`;
      site.innerHTML = `
        <div class="s-doodle">
          <header class="s-bar s-bar--doodle"><b>✏️ FreeDoodle</b><span>Totally free doodles</span></header>
          ${ad('s-ad--a', '⬇ DOWNLOAD NOW')}
          <div class="s-file">
            <p class="s-h">Doodle Pack (Volume 2)</p>
            <p>40 hand-drawn doodles of snails wearing hats.</p>
            ${ad('s-ad--b', '▶ START DOWNLOAD')}
            <p class="s-small">Your file: <button type="button" class="s-link" data-real>doodle-pack.zip</button> (2 MB)</p>
          </div>
          ${ad('s-ad--c', '✅ FAST DOWNLOAD (RECOMMENDED)')}
        </div>`;
      on(site, '[data-ad]', () => mistake('That was an ad. You just installed SuperSearchBar 3000.'));
      on(site, '[data-real]', () => complete());
    },
  },
  {
    brand: 'Mugwump Mugs',
    domain: 'mugwump.fake',
    task: 'Buy exactly one mug ($12.00) and nothing else.',
    pattern: 'Sneak Into Basket',
    explain:
      'Extra items were quietly added to your cart, and a donation and gift wrap were ticked for you. If you pay without checking, you buy things you never asked for. Always read the cart before paying.',
    render({ site, mistake, complete }) {
      const items = [
        { id: 'mug', name: 'Classic Mug (blue)', price: 12, on: true, fixed: true },
        { id: 'plan', name: 'Mug Protection Plan (2 years)', price: 4.99, on: true },
        { id: 'spoon', name: 'Matching Tiny Spoon', price: 3.5, on: true },
      ];
      site.innerHTML = `
        <div class="s-shop">
          <header class="s-bar s-bar--mug"><b>☕ Mugwump</b><span>Your basket</span></header>
          <ul class="s-cart">${items
            .map(
              (it) =>
                `<li data-item="${it.id}"><span>${it.name}</span><span>${money(it.price)}</span>${
                  it.fixed ? '<span class="s-qty">×1</span>' : `<button type="button" class="s-rm" data-rm="${it.id}" aria-label="Remove ${it.name}">✕</button>`
                }</li>`,
            )
            .join('')}</ul>
          <label class="s-check"><input type="checkbox" checked data-extra="Gift wrap"> Make it a gift (+$2.50)</label>
          <label class="s-check s-check--faint"><input type="checkbox" checked data-extra="Donation"> Round up $1.00 for the Lonely Mug Fund</label>
          <div class="s-row s-row--end"><button type="button" class="s-btn s-btn--orange" data-pay></button></div>
        </div>`;
      const total = () => {
        let t = items.filter((i) => i.on).reduce((s, i) => s + i.price, 0);
        qa<HTMLInputElement>(site, '[data-extra]').forEach((c) => {
          if (c.checked) t += c.dataset.extra === 'Gift wrap' ? 2.5 : 1;
        });
        return t;
      };
      const update = () => (q(site, '[data-pay]').textContent = `Pay ${money(total())}`);
      qa<HTMLButtonElement>(site, '[data-rm]').forEach((b) =>
        b.addEventListener('click', () => {
          const it = items.find((i) => i.id === b.dataset.rm);
          if (it) it.on = false;
          b.closest('li')?.remove();
          update();
        }),
      );
      qa(site, '[data-extra]').forEach((c) => c.addEventListener('change', update));
      on(site, '[data-pay]', () => {
        const extras = [
          ...items.filter((i) => i.on && !i.fixed).map((i) => i.name),
          ...qa<HTMLInputElement>(site, '[data-extra]').filter((c) => c.checked).map((c) => c.dataset.extra ?? ''),
        ];
        if (extras.length) mistake(`You also paid for: ${extras.join(', ')}.`);
        else complete();
      });
      update();
    },
  },
  {
    brand: 'SnoozeInn',
    domain: 'snoozeinn.fake',
    task: 'Book the Standard room for $80. Don\'t let the timer rush you.',
    pattern: 'Fake Urgency',
    explain:
      'The countdown restarted every time it hit zero, and the "almost gone" warning never changed. Fake timers and fake scarcity try to make you panic and pick the pricier option. Real deals do not need a scary clock.',
    render({ site, mistake, complete, every }) {
      site.innerHTML = `
        <div class="s-hotel">
          <header class="s-bar s-bar--hotel"><b>🛏️ SnoozeInn</b><span>Sleep like a log (a comfy one)</span></header>
          <p class="s-urgent">⏰ HURRY! This price ends in <b data-clock>0:09</b></p>
          <p class="s-urgent s-urgent--soft">🔥 Almost gone! Lots of people are looking at this right now!</p>
          <button type="button" class="s-btn s-btn--red s-btn--wide" data-rush>Book before it's gone!</button>
          <div class="s-rooms">
            <div class="s-room s-room--deluxe"><span class="s-badge">BEST VALUE</span><p class="s-h">Deluxe Room</p><p>$140 / night</p><button type="button" class="s-btn s-btn--red" data-deluxe>Book now</button></div>
            <div class="s-room"><p class="s-h">Standard Room</p><p>$80 / night</p><button type="button" class="s-btn s-btn--ghost" data-standard>Choose</button></div>
          </div>
        </div>`;
      let left = 9;
      every(() => {
        left -= 1;
        if (left < 0) left = 9;
        q(site, '[data-clock]').textContent = `0:0${left}`;
      }, 1000);
      on(site, '[data-rush], [data-deluxe]', () => mistake('You panicked and booked the $140 Deluxe Room.'));
      on(site, '[data-standard]', () => complete());
    },
  },
  {
    brand: 'Snorkel Deals',
    domain: 'snorkeldeals.fake',
    task: 'Stop ALL emails from Snorkel Deals.',
    pattern: 'Obstruction',
    explain:
      'Instead of one simple unsubscribe button, the site split its emails into lots of lists and hid the "unsubscribe from all" link at the bottom in tiny gray text. Making the exit hard is called obstruction.',
    render({ site, mistake, complete }) {
      const lists = ['Daily deals', 'Weekly deals', 'Deals about deals', 'Partner offers', 'Snorkel tips', 'Birthday reminders (yours)', 'Birthday reminders (your fish)', 'Surveys'];
      const draw = () => {
        site.innerHTML = `
          <div class="s-mail">
            <header class="s-bar s-bar--mail"><b>🤿 Snorkel Deals</b><span>Email preferences</span></header>
            <p>We would hate to see you go! Choose which emails you love:</p>
            <div class="s-lists">${lists
              .map((l, i) => `<label class="s-check"><input type="checkbox" checked data-list="${l}" id="sl-${i}"> ${l}</label>`)
              .join('')}</div>
            <div class="s-row"><button type="button" class="s-btn s-btn--blue" data-update>Update my preferences</button></div>
            <p class="s-fine">Snorkel Deals Ltd, 1 Bubble Lane. <button type="button" class="s-link s-link--faint" data-all>unsubscribe from all</button></p>
          </div>`;
        on(site, '[data-update]', () => {
          const still = qa<HTMLInputElement>(site, '[data-list]').filter((c) => c.checked);
          if (still.length) mistake(`You are still on ${still.length} ${still.length === 1 ? 'list' : 'lists'}.`);
          else complete();
        });
        on(site, '[data-all]', () => {
          q(site, '.s-mail').innerHTML = `
            <header class="s-bar s-bar--mail"><b>🤿 Snorkel Deals</b><span>Are you sure?</span></header>
            <p class="s-h">Leaving so soon? 😢</p>
            <p>You will miss out on deals about deals.</p>
            <div class="s-row s-row--stack">
              <button type="button" class="s-btn s-btn--blue s-btn--wide" data-stay>Keep me subscribed</button>
              <button type="button" class="s-btn s-btn--ghost" data-go>Unsubscribe</button>
            </div>`;
          on(site, '[data-stay]', () => {
            mistake('You clicked the big blue button and stayed subscribed.');
            draw();
          });
          on(site, '[data-go]', () => complete());
        });
      };
      draw();
    },
  },
  {
    brand: 'PixelPost',
    domain: 'pixelpost.fake',
    task: 'Create an account and say NO to every email and text message.',
    pattern: 'Trick Questions',
    explain:
      'The checkboxes used double negatives, so ticking sometimes meant yes and sometimes meant no. Confusing wording like this is designed to make you agree by accident. Read each line slowly before you tick.',
    render({ site, mistake, complete }) {
      site.innerHTML = `
        <div class="s-pixel">
          <header class="s-bar s-bar--pixel"><b>📮 PixelPost</b><span>Create your account</span></header>
          <label class="s-lab">Username<input class="s-in" value="SnackWizard" autocomplete="off"></label>
          <label class="s-check"><input type="checkbox" data-c="a"> Tick this box if you do <b>not</b> want our newsletter.</label>
          <label class="s-check"><input type="checkbox" checked data-c="b"> Untick this box if you would rather not get partner offers.</label>
          <label class="s-check"><input type="checkbox" data-c="c"> Tick here to avoid not receiving our text messages.</label>
          <div class="s-row s-row--end"><button type="button" class="s-btn s-btn--purple" data-create>Create account</button></div>
        </div>`;
      on(site, '[data-create]', () => {
        const v = (k: string) => q<HTMLInputElement>(site, `[data-c="${k}"]`).checked;
        const got: string[] = [];
        if (!v('a')) got.push('the newsletter');
        if (v('b')) got.push('partner offers');
        if (v('c')) got.push('text messages');
        if (got.length) mistake(`Oops, you signed up for ${got.join(' and ')}.`);
        else complete();
      });
    },
  },
  {
    brand: 'GigGoblin Tickets',
    domain: 'giggoblin.fake',
    task: 'Buy one concert ticket. Your budget is $40 total.',
    pattern: 'Hidden Costs',
    explain:
      'The ticket said $35, but surprise fees only showed up on the very last step, after you had already spent time choosing. This is called drip pricing. The honest move here was to cancel, because the real total broke your budget.',
    render({ site, mistake, complete }) {
      const step1 = () => {
        site.innerHTML = `
          <div class="s-gig">
            <header class="s-bar s-bar--gig"><b>🎸 GigGoblin</b><span>Step 1 of 3</span></header>
            <p class="s-h">The Humming Kettles — Live!</p>
            <p class="s-price">Tickets from <b>$35</b></p>
            <div class="s-row s-row--end"><button type="button" class="s-btn s-btn--pink" data-next>Get tickets</button></div>
          </div>`;
        on(site, '[data-next]', step2);
      };
      const step2 = () => {
        q(site, '.s-gig').innerHTML = `
          <header class="s-bar s-bar--gig"><b>🎸 GigGoblin</b><span>Step 2 of 3</span></header>
          <p class="s-h">Pick your seat</p>
          <div class="s-seats" aria-hidden="true">${'<span></span>'.repeat(18)}</div>
          <p>Seat F7 is yours. Great view of the kettles.</p>
          <div class="s-row s-row--end"><button type="button" class="s-btn s-btn--pink" data-next>Continue to payment</button></div>`;
        on(site, '[data-next]', step3);
      };
      const step3 = () => {
        const lines: [string, number][] = [
          ['Ticket', 35],
          ['Service fee', 6.5],
          ['Convenience fee', 4.25],
          ['Booking fee', 3.1],
          ['Fee processing fee', 1.99],
        ];
        const total = lines.reduce((s, [, p]) => s + p, 0);
        q(site, '.s-gig').innerHTML = `
          <header class="s-bar s-bar--gig"><b>🎸 GigGoblin</b><span>Step 3 of 3</span></header>
          <ul class="s-cart">${lines.map(([n, p]) => `<li><span>${n}</span><span>${money(p)}</span></li>`).join('')}
            <li class="s-total"><span>Total</span><span>${money(total)}</span></li></ul>
          <div class="s-row">
            <button type="button" class="s-link s-link--faint" data-cancel>Cancel order</button>
            <button type="button" class="s-btn s-btn--pink" data-pay>Pay ${money(total)}</button>
          </div>`;
        on(site, '[data-pay]', () => mistake(`You paid ${money(total)}. That is way over your $40 budget!`));
        on(site, '[data-cancel]', () => complete());
      };
      step1();
    },
  },
  {
    brand: 'AppyCalc',
    domain: 'appycalc.fake',
    task: 'Install the calculator app, but say no to every extra.',
    pattern: 'Misdirection',
    explain:
      'The buttons kept changing color, position and wording, so the "safe" choice was never in the same place. Bright colors pulled you toward yes. Sites do this to catch people who click on autopilot.',
    render({ site, mistake, complete }) {
      const steps = [
        { q: 'Also install the BonusBar toolbar?', yes: { t: 'Accept', c: 's-btn--green' }, no: { t: 'Decline', c: 's-btn--ghost' }, yesFirst: false },
        { q: 'Make SearchSnoop your homepage?', yes: { t: 'Continue', c: 's-btn--green' }, no: { t: 'Skip', c: 's-btn--ghost' }, yesFirst: true },
        { q: 'Turn off free trial apps?', yes: { t: 'No', c: 's-btn--ghost' }, no: { t: 'Yes', c: 's-btn--green' }, yesFirst: false },
        { q: 'Keep the recommended extras?', yes: { t: 'Recommended', c: 's-btn--green' }, no: { t: 'Custom (advanced)', c: 's-btn--ghost' }, yesFirst: true },
      ];
      let i = 0;
      const draw = () => {
        if (i >= steps.length) {
          site.innerHTML = `
            <div class="s-install">
              <div class="s-win"><p class="s-h">🧮 Ready to install AppyCalc</p><p>Size: 4 MB. It adds numbers. Sometimes it subtracts them.</p>
              <div class="s-row"><button type="button" class="s-btn s-btn--ghost" data-cancel>Cancel</button><button type="button" class="s-btn s-btn--green" data-install>Install</button></div></div>
            </div>`;
          on(site, '[data-cancel]', () => mistake('You cancelled the whole install. You still need the calculator!'));
          on(site, '[data-install]', () => complete());
          return;
        }
        const s = steps[i];
        const yes = `<button type="button" class="s-btn ${s.yes.c}" data-yes>${s.yes.t}</button>`;
        const no = `<button type="button" class="s-btn ${s.no.c}" data-no>${s.no.t}</button>`;
        site.innerHTML = `
          <div class="s-install">
            <div class="s-win"><p class="s-small">AppyCalc Setup · Step ${i + 1} of ${steps.length + 1}</p><p class="s-h">${s.q}</p>
            <p class="s-small">Recommended for most users.</p>
            <div class="s-row">${s.yesFirst ? yes + no : no + yes}</div></div>
          </div>`;
        on(site, '[data-yes]', () => {
          mistake('That said yes to the extra. It is installing now…');
          i += 1;
          draw();
        });
        on(site, '[data-no]', () => {
          i += 1;
          draw();
        });
      };
      draw();
    },
  },
  {
    brand: 'BrainBurp',
    domain: 'brainburp.fake',
    task: 'Make the "rate us" pop-up go away for good.',
    pattern: 'Nagging',
    explain:
      'The pop-up kept coming back, and the only way to stop it for good was a tiny link. Asking again and again wears people down until they give in. A good app takes no for an answer.',
    render({ site, mistake, complete, later }) {
      site.innerHTML = `
        <div class="s-brain">
          <header class="s-bar s-bar--brain"><b>🧠 BrainBurp</b><span>Quiz of the day</span></header>
          <p class="s-h">Which weighs more: a pound of feathers or a pound of bricks?</p>
          <div class="s-row s-row--stack"><span class="s-answer">Feathers</span><span class="s-answer">Bricks</span><span class="s-answer">They weigh the same</span></div>
          <div class="s-overlay" data-pop hidden>
            <div class="s-modal" role="dialog" aria-label="Rate us">
              <p class="s-h">Enjoying BrainBurp? 🤩</p>
              <p>Rate us 5 stars! It only takes a second!</p>
              <button type="button" class="s-btn s-btn--purple s-btn--wide" data-rate>⭐⭐⭐⭐⭐ Rate 5 stars</button>
              <button type="button" class="s-btn s-btn--ghost s-btn--wide" data-later>Remind me later</button>
              <button type="button" class="s-link s-link--tiny" data-never>don't ask again</button>
            </div>
          </div>
        </div>`;
      const pop = q(site, '[data-pop]');
      const show = () => {
        pop.hidden = false;
        q(site, '[data-rate]').focus({ preventScroll: true });
      };
      later(show, 600);
      on(site, '[data-rate]', () => mistake('You were sent to a fake app store to leave a review.'));
      on(site, '[data-later]', () => {
        pop.hidden = true;
        mistake('"Later" turned out to mean two seconds from now.');
        later(show, 1800);
      });
      on(site, '[data-never]', () => complete());
    },
  },
  {
    brand: 'FriendFlock',
    domain: 'friendflock.fake',
    task: 'Join FriendFlock without sharing your contacts or your location.',
    pattern: 'Hidden Data Sharing',
    explain:
      'The sharing options were switched on and hidden under "More options", below the big join button. Sites bury these settings so most people share more than they meant to. Always peek at hidden options.',
    render({ site, mistake, complete }) {
      site.innerHTML = `
        <div class="s-flock">
          <header class="s-bar s-bar--flock"><b>🐦 FriendFlock</b><span>Find your flock</span></header>
          <label class="s-lab">Name<input class="s-in" value="Pat Pancake" autocomplete="off"></label>
          <label class="s-lab">Email<input class="s-in" value="pat@pancake.fake" autocomplete="off"></label>
          <button type="button" class="s-btn s-btn--blue s-btn--wide" data-join>Join FriendFlock</button>
          <button type="button" class="s-link s-link--faint" data-more aria-expanded="false">More options ▾</button>
          <div class="s-more" data-opts hidden>
            <label class="s-check"><input type="checkbox" checked data-share="contacts"> Invite everyone in my contacts</label>
            <label class="s-check"><input type="checkbox" checked data-share="location"> Share my location with partners</label>
            <label class="s-check"><input type="checkbox" checked> Show my birthday on my profile</label>
          </div>
        </div>`;
      on(site, '[data-more]', (e) => {
        const b = e.currentTarget as HTMLElement;
        const box = q(site, '[data-opts]');
        box.hidden = !box.hidden;
        b.setAttribute('aria-expanded', String(!box.hidden));
      });
      on(site, '[data-join]', () => {
        const shared = qa<HTMLInputElement>(site, '[data-share]').filter((c) => c.checked).map((c) => c.dataset.share);
        if (shared.includes('contacts')) mistake('FriendFlock just sent an invite to every contact you have. Even your dentist.');
        else if (shared.includes('location')) mistake('Your location is now shared with partners.');
        else complete();
      });
    },
  },
  {
    brand: 'SockBox',
    domain: 'sockbox.fake',
    task: 'Start the free trial, but make sure it will NOT renew and charge you.',
    pattern: 'Forced Continuity',
    explain:
      'The free trial was set to turn into a paid plan automatically, and the switch was hidden in the small print. Many people forget and get charged for months. Turn off auto-renew, or set a reminder.',
    render({ site, mistake, complete }) {
      site.innerHTML = `
        <div class="s-sock">
          <header class="s-bar s-bar--sock"><b>🧦 SockBox</b><span>A surprise sock every month</span></header>
          <p class="s-h">Try 7 days FREE!</p>
          <p>Card: <b>•••• •••• •••• 4242</b> (pretend card)</p>
          <button type="button" class="s-btn s-btn--orange s-btn--wide" data-start>Start my free trial</button>
          <p class="s-fine">By starting your trial you agree to our Sock Terms. Trial ends after 7 days.
            <label class="s-tiny-toggle"><input type="checkbox" checked data-renew> Auto-renew at $29.99/month</label> Cancel anytime by mail.</p>
        </div>`;
      on(site, '[data-start]', () => {
        if (q<HTMLInputElement>(site, '[data-renew]').checked) mistake('In 7 days you will be charged $29.99. And every month after.');
        else complete();
      });
    },
  },
  {
    brand: 'WeatherWhale',
    domain: 'weatherwhale.fake',
    task: 'Close the ad to see today\'s weather.',
    pattern: 'Disguised Close Button',
    explain:
      'The big X was just part of the ad picture, so tapping it opened the ad instead. The real close button was small text that appeared after a few seconds. Fake close buttons trick you into clicking ads.',
    render({ site, mistake, complete, later }) {
      site.innerHTML = `
        <div class="s-whale">
          <header class="s-bar s-bar--whale"><b>🐋 WeatherWhale</b><span>Forecasts with a splash</span></header>
          <div class="s-weather"><p class="s-h">Today: ☀️ 24°</p><p>Sunny with a small chance of whales.</p></div>
          <div class="s-overlay s-overlay--ad" data-ad>
            <div class="s-bigad">
              <span class="s-adtag">Ad</span>
              <button type="button" class="s-fakex" data-fake aria-label="Close">✕</button>
              <p class="s-h">MEGA GAME 9000</p>
              <p>Tap anywhere to play the most exciting game ever made!</p>
              <button type="button" class="s-btn s-btn--red" data-fake>PLAY FREE</button>
              <p class="s-skip" data-skip>Close in 3…</p>
            </div>
          </div>
        </div>`;
      on(site, '[data-fake]', () => mistake('That X was part of the ad picture. You opened MEGA GAME 9000.'));
      let n = 3;
      const tick = () => {
        n -= 1;
        const skip = q(site, '[data-skip]');
        if (!skip) return;
        if (n > 0) {
          skip.textContent = `Close in ${n}…`;
          later(tick, 1000);
        } else {
          skip.innerHTML = '<button type="button" class="s-link s-link--light" data-close>Close ad ›</button>';
          on(site, '[data-close]', () => {
            q(site, '[data-ad]').remove();
            complete();
          });
        }
      };
      later(tick, 1000);
    },
  },
  {
    brand: 'StreamBean',
    domain: 'streambean.fake',
    task: 'Cancel your StreamBean free trial.',
    pattern: 'Roach Motel',
    explain:
      'Joining took one click, but leaving took many screens: a hidden cancel link, a guilt trip, a survey and a last-minute discount. Easy to get in, hard to get out. That is the roach motel.',
    render({ site, mistake, complete }) {
      const bar = (sub: string) => `<header class="s-bar s-bar--bean"><b>🫘 StreamBean</b><span>${sub}</span></header>`;
      const home = () => {
        site.innerHTML = `<div class="s-bean">
          ${bar('<button type="button" class="s-link s-link--light" data-account>👤 Account</button>')}
          <p class="s-h">Continue watching</p>
          <div class="s-tiles" aria-hidden="true"><span>Cooking With Ghosts</span><span>Snail Racing Live</span><span>The Very Long Nap</span></div>
          <button type="button" class="s-btn s-btn--red s-btn--wide" data-watch>▶ Keep watching</button>
        </div>`;
        on(site, '[data-watch]', () => mistake('You started another episode. The trial is still running.'));
        on(site, '[data-account]', account);
      };
      const account = () => {
        q(site, '.s-bean').innerHTML = `
          ${bar('Account')}
          <p>Plan: <b>Free trial</b>, then $14.99/month in 2 days.</p>
          <button type="button" class="s-btn s-btn--red s-btn--wide" data-upgrade>⭐ Upgrade to Bean Max</button>
          <div class="s-row"><button type="button" class="s-btn s-btn--ghost" data-manage>Manage plan</button><button type="button" class="s-link s-link--light" data-home>Back</button></div>`;
        on(site, '[data-upgrade]', () => mistake('You upgraded to Bean Max. That costs even more!'));
        on(site, '[data-manage]', manage);
        on(site, '[data-home]', home);
      };
      const manage = () => {
        q(site, '.s-bean').innerHTML = `
          ${bar('Manage plan')}
          <ul class="s-menu"><li><button type="button" class="s-btn s-btn--ghost s-btn--wide" data-pause>⏸ Pause instead</button></li>
          <li><button type="button" class="s-btn s-btn--ghost s-btn--wide" data-change>🔁 Change plan</button></li></ul>
          <p class="s-fine">Need something else? <button type="button" class="s-link s-link--faint" data-cancel>Cancel membership</button></p>`;
        on(site, '[data-pause]', () => mistake('Pausing is not cancelling. It starts again next month.'));
        on(site, '[data-change]', () => mistake('That just shows more plans. Look for the real cancel link.'));
        on(site, '[data-cancel]', guilt);
      };
      const guilt = () => {
        q(site, '.s-bean').innerHTML = `
          ${bar('Are you sure?')}
          <p class="s-h">Wait! Beanie will be so sad 😭</p>
          <p>You will lose your watchlist, your profile and your place in Snail Racing Live.</p>
          <button type="button" class="s-btn s-btn--red s-btn--wide" data-keep>Keep my membership</button>
          <button type="button" class="s-btn s-btn--ghost s-btn--wide" data-go>Continue cancelling</button>`;
        on(site, '[data-keep]', () => mistake('You kept your membership. Beanie is happy. Your wallet is not.'));
        on(site, '[data-go]', survey);
      };
      const survey = () => {
        const reasons = ['Too expensive', 'Not enough snails', 'I just want to cancel'];
        q(site, '.s-bean').innerHTML = `
          ${bar('Quick question')}
          <p class="s-h">Why are you leaving?</p>
          <div class="s-lists">${reasons.map((r) => `<label class="s-check"><input type="radio" name="sb-why" value="${r}"> ${r}</label>`).join('')}</div>
          <div class="s-row s-row--end"><button type="button" class="s-btn s-btn--ghost" data-next>Submit and continue</button></div>
          <p class="s-small" data-need></p>`;
        on(site, '[data-next]', () => {
          if (!site.querySelector('input[name="sb-why"]:checked')) {
            q(site, '[data-need]').textContent = 'Please pick a reason first.';
            return;
          }
          offer();
        });
      };
      const offer = () => {
        q(site, '.s-bean').innerHTML = `
          ${bar('Special offer')}
          <p class="s-h">Stay for 50% off! 🎉</p>
          <p>Only $7.49/month for 3 months, then $14.99/month.</p>
          <button type="button" class="s-btn s-btn--red s-btn--wide" data-accept>Yes, give me the deal!</button>
          <button type="button" class="s-link s-link--light" data-final>No thanks, cancel my trial</button>`;
        on(site, '[data-accept]', () => mistake('You accepted the deal. You are still subscribed, just cheaper for now.'));
        on(site, '[data-final]', () => {
          q(site, '.s-bean').innerHTML = `${bar('Cancelled')}<p class="s-h">Your trial is cancelled.</p><p>You escaped. Beanie will be fine.</p>`;
          complete();
        });
      };
      home();
    },
  },
];
