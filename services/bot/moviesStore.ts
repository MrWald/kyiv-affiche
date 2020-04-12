import { projectKey, sadd, sismember } from '../red';
const rootKey = `${projectKey}:movies`;

export const addToNotifiedMovies = async (movies: string[]) => (
  sadd(`${rootKey}:notified`, ...movies)
);

export const filterNotNotifiedMovies = async (movies: string[]): Promise<string[]> => {
  const notNotified: string[] = [];
  for (const movie of movies) {
    const isMovieNotified = await isNotified(movie);
    if (!isMovieNotified) {
      notNotified.push(movie);
    }
  }
  return notNotified;
};

const isNotified = (movies: string) => (
  sismember(`${rootKey}:notified`, movies)
);
