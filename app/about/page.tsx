import { TEAM } from "@/lib/team";

export const metadata = { title: "About | Rural Talent Scout" };

export default function About() {
  return (
    <div className="about">
      <h1>About Rural Talent Scout</h1>
      <p className="muted">
        A community project and Java micro project. Talent exists in every village. Visibility does not.
        This site gives young rural athletes a fair way to be seen.
      </p>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>What it is</h2>
        <p>
          A website and phone app where a player films one simple drill, gets a score from 0 to 100 compared with
          other players of their own age group and gender, and becomes visible to verified scouts and coaches.
          It covers 40 sports from school level up to national level: athletics, team sports, racquet sports,
          combat and strength, and skill and endurance events.
        </p>

        <h2>Why we built it</h2>
        <p>
          Many gifted players in villages never get a trial. Scouts cannot visit every village, selection camps are
          far away, and travelling to them costs money. A phone video should be enough to be noticed. Scoring
          against an age group also keeps it fair: a 13 year old is never judged against a 19 year old.
        </p>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>How to use it</h2>
        <h3>If you are a player</h3>
        <ol>
          <li><strong>Create an account.</strong> Choose a username (it must not be taken), set a password with at least 8 characters, a letter and a number, and enter the 6 digit code we email you.</li>
          <li><strong>Fill in your profile.</strong> Age, gender, village, district and state. Parents or guardians can allow scouts to see your profile.</li>
          <li><strong>Select a sport.</strong> Search by name or browse by category.</li>
          <li><strong>Read the drill and camera tips.</strong> Each sport has one simple drill and a short guide on how to film it.</li>
          <li><strong>Film and upload.</strong> Record the drill, enter your result (time, distance or count) and upload. With no network the video waits on your phone and uploads on its own when you are online.</li>
          <li><strong>Get checked and scored.</strong> A video checker confirms the clip is genuine, then the Java engine gives your 0 to 100 score for your age group.</li>
          <li><strong>Get noticed.</strong> Scouts browse scored players, watch the video and shortlist the ones they like.</li>
        </ol>
        <h3>If you are a scout or coach</h3>
        <ol>
          <li>Sign up as a scout. Your account is approved by an administrator before you can see players.</li>
          <li>Filter players by sport, state and minimum score.</li>
          <li>Watch the video, then shortlist the player.</li>
        </ol>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>How the pieces fit</h2>
        <ul>
          <li><strong>Website and app (Next.js PWA):</strong> one codebase. On a phone it opens as an app with a bottom tab bar and can be installed to the home screen. On a desktop it is a full website.</li>
          <li><strong>Accounts, data and videos (Supabase):</strong> sign-in with email codes, unique usernames, profiles, private video storage and row-level security so players only see their own data.</li>
          <li><strong>Video checker (Python):</strong> rejects clips that are too short or too long, still images, clips with no person moving, and videos that were already uploaded.</li>
          <li><strong>Scoring engine (Java, Spring Boot):</strong> turns a measured result into a score using the benchmark for that sport, age group and gender.</li>
        </ul>

        <h2>How a score is calculated</h2>
        <p>
          Every sport and age group has two reference results: a floor that earns 0 points and an elite result that
          earns 100 points. The score is the player&apos;s position between them:
        </p>
        <pre className="code">{`score = clamp( (value - floor) / (elite - floor), 0, 1 ) x 100`}</pre>
        <p>
          The same formula works when lower is better, like a sprint time, because the floor is then the larger number.
          A result far beyond elite level is rejected as unrealistic.
        </p>
        <p className="muted">
          Honest note: the benchmark numbers are starter values for school age groups, cross-checked against published
          sports university entry standards for sprint, standing broad jump, shuttle run, sit-ups and middle distance
          running. They should be calibrated with real district and state norms before anyone is selected using them.
        </p>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>The Java scoring service</h2>
        <p>A REST service built with Java 17 and Spring Boot. The website calls <code>POST /api/score</code>:</p>
        <pre className="code">{`POST /api/score
{ "sport": "sprint", "age": 16, "gender": "male", "value": 7.0 }

200 OK
{ "score": 52.2, "ageBand": "U16", "band": "DEVELOPING",
  "floor": 8.2, "elite": 5.9, ... }`}</pre>
        <h3>Java concepts it uses</h3>
        <ul>
          <li><strong>Interface:</strong> <code>SportScorer</code> is the contract every sport follows.</li>
          <li><strong>Abstract class and inheritance:</strong> <code>BenchmarkScorer</code> holds the shared logic and the sport classes extend it.</li>
          <li><strong>Polymorphism:</strong> the service calls <code>scorer.score(...)</code> without knowing which sport it is.</li>
          <li><strong>Enums:</strong> <code>AgeBand</code>, <code>Gender</code>, <code>RankBand</code>, <code>AgeCurve</code>.</li>
          <li><strong>Records:</strong> <code>Benchmark</code>, <code>ScoreRequest</code> and <code>ScoreResponse</code> are immutable data carriers.</li>
          <li><strong>Collections:</strong> <code>EnumMap</code> for benchmark tables, <code>LinkedHashMap</code> in the registry.</li>
          <li><strong>Exception handling:</strong> a custom <code>ScoringException</code> becomes a friendly HTTP 400 message.</li>
          <li><strong>Dependency injection:</strong> Spring injects every <code>SportScorer</code> into <code>ScorerRegistry</code>, so adding a sport is adding data, not rewriting code.</li>
          <li><strong>Unit tests:</strong> JUnit 5 tests for the maths and the API.</li>
        </ul>
      </div>

      <h2>Team</h2>
      <div className="team">
        {TEAM.map((m) => (
          <div className="member" key={m.name}>
            <h3>{m.name}</h3>
            <div className="muted">{m.role}</div>
            <div className="links">
              {m.instagram && <a href={`https://instagram.com/${m.instagram}`} target="_blank" rel="noopener noreferrer">Instagram</a>}
              {m.linkedin && <a href={`https://www.linkedin.com/in/${m.linkedin}`} target="_blank" rel="noopener noreferrer">LinkedIn</a>}
              {m.github && <a href={`https://github.com/${m.github}`} target="_blank" rel="noopener noreferrer">GitHub</a>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
