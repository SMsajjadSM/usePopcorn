import { useEffect, useRef, useState } from "react";
import StarRating from "./starRating";
import { useLocalStorageState as localStorage } from "./useLocalStorage.jsx";
import { useKey } from "./useKey.jsx";

const average = (arr) =>
  arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);

const Key = "4465e1bc";
export default function App() {
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [watched, setWatched] = localStorage([], "watched");

  function handleSelectMovie(id) {
    setSelectedId((selectedId) => (id === selectedId ? null : id));
  }
  function handleCloseMovies() {
    setSelectedId(null);
  }
  function handleAddWatch(movie) {
    setWatched((watched) => [...watched, movie]);
  }
  function handleDeleteMovie(id) {
    setWatched((movie) => movie.filter((movie) => movie.imdbId !== id));
  }

  useEffect(
    function () {
      const controller = new AbortController();
      async function fetchMovie() {
        try {
          setError("");
          setIsLoading(true);
          const res = await fetch(
            `https://www.omdbapi.com/?apikey=${Key}&s=${query}`,
            { signal: controller.signal }
          );
          if (!res.ok)
            throw new Error("Something Went Wrong with Fetching Movie");

          const data = await res.json();

          if (data.Response === "False") throw new Error("Movie not Found ");

          setMovies(data.Search);
          setError("");
        } catch (err) {
          if (err.name !== "AbortError") {
            setError(err.message);
          }
        } finally {
          setIsLoading(false);
        }
      }
      if (query.length < 3) {
        setError("");
        setMovies([]);
        return;
      }
      handleCloseMovies();
      fetchMovie();
      return function () {
        controller.abort();
      };
    },
    [query]
  );
  return (
    <>
      <Nav>
        <Search setQuery={setQuery} query={query} />
        <NumResult movies={movies} />
      </Nav>

      <Main>
        <Box>
          {isLoading && <Loader />}
          {error && <ErrorMessage message={error} />}
          {!isLoading && !error && (
            <MovieList movies={movies} onSelectMovie={handleSelectMovie} />
          )}
        </Box>
        <Box>
          {selectedId ? (
            <MoviesDetail
              onSelectClose={handleCloseMovies}
              selectedId={selectedId}
              onhandleAddWatch={handleAddWatch}
              handleCloseMovies={handleCloseMovies}
              watched={watched}
            />
          ) : (
            <>
              {" "}
              <Summary watched={watched} />
              <List watched={watched} handleDeleteMovie={handleDeleteMovie} />
            </>
          )}
        </Box>
      </Main>
    </>
  );
}
function ErrorMessage({ message }) {
  return (
    <p className="error">
      <span>📛</span>
      {message}
    </p>
  );
}
function Loader() {
  return <p className="loader"> Loading...</p>;
}
function Nav({ children }) {
  return (
    <nav className="nav-bar">
      <Logo />
      {children}
    </nav>
  );
}
function NumResult({ movies }) {
  return (
    <p className="num-results">
      Found <strong>{movies.length}</strong> results
    </p>
  );
}
function Logo() {
  return (
    <div className="logo">
      <span role="img">🍿</span>
      <h1>usePopcorn</h1>
    </div>
  );
}
function Search({ setQuery, query }) {
  const inputEl = useRef(null);

  useKey("Enter", function () {
    if (document.activeElement === inputEl.current) return;
    inputEl.current.focus();
    setQuery("");
  });

  // useEffect(
  //   function () {
  //     function callBack(e) {
  //       if (document.activeElement === inputEl.current) return;
  //       if (e.code === "Enter") {
  //         inputEl.current.focus();
  //         setQuery("");
  //       }
  //     }
  //     document.addEventListener("keydown  ", callBack);
  //     return document.addEventListener("keydown", callBack);
  //   },
  //   [setQuery]
  // );
  return (
    <input
      className="search"
      type="text"
      placeholder="Search movies..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      ref={inputEl}
    />
  );
}
function Main({ children }) {
  return <main className="main">{children}</main>;
}
function Box({ children }) {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className="box">
      <button className="btn-toggle" onClick={() => setIsOpen((open) => !open)}>
        {isOpen ? "–" : "+"}
      </button>
      {isOpen && children}
    </div>
  );
}

function MovieList({ movies, onSelectMovie }) {
  return (
    <ul className="list list-movies">
      {movies?.map((movie) => (
        <li onClick={() => onSelectMovie(movie.imdbID)} key={movie.imdbID}>
          <img src={movie.Poster} alt={`${movie.Title} poster`} />
          <h3>{movie.Title}</h3>
          <div>
            <p>
              <span>📅</span>
              <span>{movie.Year}</span>
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
function MoviesDetail({
  selectedId,
  onSelectClose,
  onhandleAddWatch,
  handleCloseMovies,
  watched,
}) {
  const [movie, setMovie] = useState({});
  const [loading, setLoading] = useState(false);
  const [userRating, setUserRating] = useState("");
  const {
    Title: title,
    Year: year,
    Poster: poster,
    Runtime: runtime,
    imdbRating,
    Plot: plot,
    Released: released,
    Actors: actors,
    Director: director,
    Genre: genre,
  } = movie;
  const isWatched = watched.map((movie) => movie.imdbId).includes(selectedId);
  function handleAdd() {
    const AddNewWatchMovie = {
      imdbId: selectedId,
      title,
      year,
      poster,
      imdbRating: Number(imdbRating),
      runtime: Number(runtime.split(" ").at(0)),
      userRating,
    };

    onhandleAddWatch(AddNewWatchMovie);
    handleCloseMovies();
  }
  const ratingWatchMovie = watched.find(
    (movie) => movie.imdbId === selectedId
  )?.userRating;

  useKey("Escape", onSelectClose);

  useEffect(
    function () {
      async function getMovieDetail() {
        setLoading(true);
        const res = await fetch(
          `https://www.omdbapi.com/?apikey=${Key}&i=${selectedId}`
        );
        const data = await res.json();
        setMovie(data);
        setLoading(false);
      }
      getMovieDetail();
    },
    [selectedId]
  );
  useEffect(
    function () {
      if (!title) return;
      document.title = `Movie | ${title}`;
      return function () {
        document.title = "usePopcrn";
      };
    },
    [title]
  );
  return (
    <div className="details">
      {loading ? (
        <Loader />
      ) : (
        <>
          <header>
            <button className="btn-back" onClick={onSelectClose}>
              ❌
            </button>
            <img src={poster} alt={`poster of ${movie} movie`} />
            <div className="details-overview">
              <h2>{title}</h2>
              <p>
                {released} &bull; {runtime}
              </p>
              <p>{genre}</p>
              <p>
                <span>⭐</span>
                {imdbRating} IMDB rating
              </p>
            </div>
          </header>
          <section>
            <div className="rating">
              {isWatched ? (
                <p>You rates with movie {ratingWatchMovie}⭐</p>
              ) : (
                <>
                  <StarRating
                    size={24}
                    maxRating={10}
                    setUserRating={setUserRating}
                  />
                  {userRating > 0 && (
                    <button className="btn-add" onClick={handleAdd}>
                      + Add To List
                    </button>
                  )}
                </>
              )}
            </div>
            <p>
              <em>{plot}</em>
            </p>
            <p>Starring {actors}</p>
            <p>Direct By {director}</p>
          </section>
        </>
      )}
    </div>
  );
}
function Summary({ watched }) {
  const avgImdbRating = average(watched.map((movie) => movie.imdbRating));
  const avgUserRating = average(watched.map((movie) => movie.userRating));
  const avgRuntime = average(watched.map((movie) => movie.runtime));
  return (
    <div className="summary">
      <h2>Movies you watched</h2>
      <div>
        <p>
          <span>#️⃣</span>
          <span>{watched.length} movies</span>
        </p>
        <p>
          <span>⭐️</span>
          <span>{avgImdbRating.toFixed(2)}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{avgUserRating.toFixed(2)}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{avgRuntime} min</span>
        </p>
      </div>
    </div>
  );
}
function List({ watched, handleDeleteMovie }) {
  return (
    <ul className="list">
      {watched.map((movie) => (
        <li key={movie.imdbID}>
          <img src={movie.poster} alt={`${movie.title} poster`} />
          <h3>{movie.title}</h3>
          <div>
            <p>
              <span>⭐️</span>
              <span>{movie.imdbRating}</span>
            </p>
            <p>
              <span>🌟</span>
              <span>{movie.userRating}</span>
            </p>
            <p>
              <span>⏳</span>
              <span>{movie.runtime} min</span>
            </p>
            <button
              className="btn-delete"
              onClick={() => handleDeleteMovie(movie.imdbId)}
            >
              ❌
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
