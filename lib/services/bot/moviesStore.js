import { projectKey, sadd, sismember } from 'services/redis';
const rootKey = `${projectKey}:movies`;
export const addToNotifiedMovies = async (movies) => (sadd(`${rootKey}:notified`, ...movies));
export const filterNotNotifiedMovies = async (movies) => {
    const notNotified = [];
    for (const movie of movies) {
        const isMovieNotified = await isNotified(movie);
        if (!isMovieNotified) {
            notNotified.push(movie);
        }
    }
    return notNotified;
};
const isNotified = (movies) => (sismember(`${rootKey}:notified`, movies));
//# sourceMappingURL=moviesStore.js.map