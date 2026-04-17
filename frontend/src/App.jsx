import { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const request = async (path, options = {}, token) => {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
};

function App() {
  const [authMode, setAuthMode] = useState('login');
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [posts, setPosts] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [adminData, setAdminData] = useState({ posts: [], questions: [], answers: [] });
  const [postForm, setPostForm] = useState({ title: '', category: 'discussion', content: '' });
  const [questionForm, setQuestionForm] = useState({ title: '', content: '' });
  const [commentInputs, setCommentInputs] = useState({});
  const [answerInputs, setAnswerInputs] = useState({});
  const [status, setStatus] = useState('');

  const isAdmin = user?.role === 'admin';

  const setSession = (nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem('token', nextToken);
    localStorage.setItem('user', JSON.stringify(nextUser));
  };

  const logout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const loadFeed = useCallback(async () => {
    try {
      const [postsData, questionsData] = await Promise.all([
        request('/posts'),
        request('/questions'),
      ]);
      setPosts(postsData);
      setQuestions(questionsData);
    } catch (error) {
      setStatus(error.message);
    }
  }, []);

  const loadAdminData = useCallback(async () => {
    if (!isAdmin || !token) {
      return;
    }

    try {
      const data = await request('/admin/dashboard', {}, token);
      setAdminData(data);
    } catch (error) {
      setStatus(error.message);
    }
  }, [isAdmin, token]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadFeed();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadFeed]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadAdminData();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadAdminData]);

  const handleAuthSubmit = async (event) => {
    event.preventDefault();

    try {
      const endpoint = authMode === 'register' ? '/auth/register' : '/auth/login';
      const payload =
        authMode === 'register'
          ? authForm
          : { email: authForm.email, password: authForm.password };
      const data = await request(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setSession(data.token, data.user);
      setAuthForm({ name: '', email: '', password: '' });
      setStatus(authMode === 'register' ? 'Welcome to the community!' : 'Logged in successfully');
      await loadFeed();
      if (data.user.role === 'admin') {
        await loadAdminData();
      }
    } catch (error) {
      setStatus(error.message);
    }
  };

  const createPost = async (event) => {
    event.preventDefault();

    try {
      await request('/posts', { method: 'POST', body: JSON.stringify(postForm) }, token);
      setPostForm({ title: '', category: 'discussion', content: '' });
      setStatus('Post published');
      await loadFeed();
      await loadAdminData();
    } catch (error) {
      setStatus(error.message);
    }
  };

  const createQuestion = async (event) => {
    event.preventDefault();

    try {
      await request('/questions', { method: 'POST', body: JSON.stringify(questionForm) }, token);
      setQuestionForm({ title: '', content: '' });
      setStatus('Question posted');
      await loadFeed();
      await loadAdminData();
    } catch (error) {
      setStatus(error.message);
    }
  };

  const addComment = async (postId) => {
    const content = commentInputs[postId];
    if (!content) return;

    try {
      await request(`/posts/${postId}/comment`, { method: 'POST', body: JSON.stringify({ content }) }, token);
      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
      await loadFeed();
    } catch (error) {
      setStatus(error.message);
    }
  };

  const toggleLikePost = async (postId) => {
    try {
      await request(`/posts/${postId}/like`, { method: 'POST' }, token);
      await loadFeed();
      await loadAdminData();
    } catch (error) {
      setStatus(error.message);
    }
  };

  const addAnswer = async (questionId) => {
    const content = answerInputs[questionId];
    if (!content) return;

    try {
      await request(`/questions/${questionId}/answers`, { method: 'POST', body: JSON.stringify({ content }) }, token);
      setAnswerInputs((prev) => ({ ...prev, [questionId]: '' }));
      await loadFeed();
      await loadAdminData();
    } catch (error) {
      setStatus(error.message);
    }
  };

  const upvoteAnswer = async (answerId) => {
    try {
      await request(`/answers/${answerId}/upvote`, { method: 'POST' }, token);
      await loadFeed();
      await loadAdminData();
    } catch (error) {
      setStatus(error.message);
    }
  };

  const moderate = async (type, id) => {
    try {
      await request(`/admin/${type}/${id}/toggle-visibility`, { method: 'PATCH' }, token);
      await Promise.all([loadFeed(), loadAdminData()]);
      setStatus('Moderation updated');
    } catch (error) {
      setStatus(error.message);
    }
  };

  const feedStats = useMemo(
    () => ({
      posts: posts.length,
      questions: questions.length,
      answers: questions.reduce((acc, item) => acc + item.answers.length, 0),
    }),
    [posts, questions]
  );

  return (
    <div className="layout">
      <header className="card topbar">
        <div>
          <h1>Church Community Hub</h1>
          <p>Faith blogs, teachings, and Q&A in one place.</p>
        </div>
        {user ? (
          <div className="user-box">
            <span>
              {user.name} ({user.role})
            </span>
            <button onClick={logout}>Logout</button>
          </div>
        ) : null}
      </header>

      {status ? <div className="status">{status}</div> : null}

      {!user ? (
        <section className="card auth-card">
          <div className="auth-tabs">
            <button className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')}>
              Login
            </button>
            <button className={authMode === 'register' ? 'active' : ''} onClick={() => setAuthMode('register')}>
              Register
            </button>
          </div>
          <form onSubmit={handleAuthSubmit}>
            {authMode === 'register' ? (
              <input
                placeholder="Full name"
                value={authForm.name}
                onChange={(event) => setAuthForm((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
            ) : null}
            <input
              type="email"
              placeholder="Email"
              value={authForm.email}
              onChange={(event) => setAuthForm((prev) => ({ ...prev, email: event.target.value }))}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={authForm.password}
              onChange={(event) => setAuthForm((prev) => ({ ...prev, password: event.target.value }))}
              required
            />
            <button type="submit">{authMode === 'register' ? 'Create Account' : 'Login'}</button>
          </form>
        </section>
      ) : (
        <section className="actions-grid">
          <form className="card" onSubmit={createPost}>
            <h2>Create Blog Post</h2>
            <input
              placeholder="Title"
              value={postForm.title}
              onChange={(event) => setPostForm((prev) => ({ ...prev, title: event.target.value }))}
              required
            />
            <select
              value={postForm.category}
              onChange={(event) => setPostForm((prev) => ({ ...prev, category: event.target.value }))}
            >
              <option value="faith">Faith</option>
              <option value="teachings">Teachings</option>
              <option value="discussion">Discussion</option>
            </select>
            <textarea
              placeholder="Share your thoughts"
              value={postForm.content}
              onChange={(event) => setPostForm((prev) => ({ ...prev, content: event.target.value }))}
              required
            />
            <button type="submit">Publish Post</button>
          </form>

          <form className="card" onSubmit={createQuestion}>
            <h2>Ask a Question</h2>
            <input
              placeholder="Question title"
              value={questionForm.title}
              onChange={(event) => setQuestionForm((prev) => ({ ...prev, title: event.target.value }))}
              required
            />
            <textarea
              placeholder="Describe your question"
              value={questionForm.content}
              onChange={(event) => setQuestionForm((prev) => ({ ...prev, content: event.target.value }))}
              required
            />
            <button type="submit">Post Question</button>
          </form>
        </section>
      )}

      <section className="stats-grid">
        <article className="card stat">
          <h3>{feedStats.posts}</h3>
          <span>Posts</span>
        </article>
        <article className="card stat">
          <h3>{feedStats.questions}</h3>
          <span>Questions</span>
        </article>
        <article className="card stat">
          <h3>{feedStats.answers}</h3>
          <span>Answers</span>
        </article>
      </section>

      <section className="content-grid">
        <div className="card">
          <h2>Blog Feed</h2>
          {posts.length === 0 ? <p>No posts yet.</p> : null}
          {posts.map((post) => (
            <article key={post._id} className="item">
              <div className="item-header">
                <strong>{post.title}</strong>
                <span className="tag">{post.category}</span>
              </div>
              <p>{post.content}</p>
              <small>
                By {post.author?.name || 'Unknown'} · {post.likes.length} likes
              </small>
              {user ? <button onClick={() => toggleLikePost(post._id)}>Like / Unlike</button> : null}
              <div className="subitems">
                {post.comments.map((comment) => (
                  <p key={comment._id}>
                    <strong>{comment.user?.name || 'Member'}:</strong> {comment.content}
                  </p>
                ))}
              </div>
              {user ? (
                <div className="inline-form">
                  <input
                    placeholder="Write a comment"
                    value={commentInputs[post._id] || ''}
                    onChange={(event) =>
                      setCommentInputs((prev) => ({ ...prev, [post._id]: event.target.value }))
                    }
                  />
                  <button onClick={() => addComment(post._id)}>Comment</button>
                </div>
              ) : null}
            </article>
          ))}
        </div>

        <div className="card">
          <h2>Q&A</h2>
          {questions.length === 0 ? <p>No questions yet.</p> : null}
          {questions.map((question) => (
            <article key={question._id} className="item">
              <strong>{question.title}</strong>
              <p>{question.content}</p>
              <small>Asked by {question.author?.name || 'Unknown'}</small>
              <div className="subitems">
                {question.answers.map((answer) => (
                  <p key={answer._id}>
                    <strong>{answer.author?.name || 'Member'}:</strong> {answer.content} ({answer.upvotes.length}{' '}
                    upvotes)
                    {user ? <button onClick={() => upvoteAnswer(answer._id)}>Upvote</button> : null}
                  </p>
                ))}
              </div>
              {user ? (
                <div className="inline-form">
                  <input
                    placeholder="Write an answer"
                    value={answerInputs[question._id] || ''}
                    onChange={(event) =>
                      setAnswerInputs((prev) => ({ ...prev, [question._id]: event.target.value }))
                    }
                  />
                  <button onClick={() => addAnswer(question._id)}>Answer</button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      {isAdmin ? (
        <section className="card">
          <h2>Admin Moderation</h2>
          <div className="moderation-grid">
            <div>
              <h3>Posts</h3>
              {adminData.posts.map((post) => (
                <p key={post._id}>
                  {post.title} ({post.isHidden ? 'Hidden' : 'Visible'}){' '}
                  <button onClick={() => moderate('posts', post._id)}>Toggle</button>
                </p>
              ))}
            </div>
            <div>
              <h3>Questions</h3>
              {adminData.questions.map((question) => (
                <p key={question._id}>
                  {question.title} ({question.isHidden ? 'Hidden' : 'Visible'}){' '}
                  <button onClick={() => moderate('questions', question._id)}>Toggle</button>
                </p>
              ))}
            </div>
            <div>
              <h3>Answers</h3>
              {adminData.answers.map((answer) => (
                <p key={answer._id}>
                  {answer.content.slice(0, 40)} ({answer.isHidden ? 'Hidden' : 'Visible'}){' '}
                  <button onClick={() => moderate('answers', answer._id)}>Toggle</button>
                </p>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

export default App;
