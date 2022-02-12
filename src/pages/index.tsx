import { GetStaticProps } from 'next';
import { useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { FaCalendar as CalendarIcon, FaUser as UserIcon } from 'react-icons/fa';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Header from '../components/Header';
import { getPrismicClient } from '../services/prismic';
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home(props: HomeProps): JSX.Element {
  const { postsPagination } = props;

  const [storePosts, setStorePosts] = useState(postsPagination);

  const handleMorePosts = (url: string): void => {
    fetch(url).then(response =>
      response.json().then(posts => {
        if (posts !== null) {
          const { next_page, results } = posts;

          const newPost: Post = {
            uid: results[0]?.uid,
            first_publication_date: results[0]?.first_publication_date,
            data: results[0]?.data,
          };

          setStorePosts({
            results: [...storePosts.results, newPost],
            next_page,
          });
        }
      })
    );
  };

  return (
    <>
      <Head>
        <title>Home</title>
      </Head>
      <Header />
      <main className={commonStyles.container}>
        <div className={commonStyles.posts}>
          {storePosts.results.map(post => (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                <div className={commonStyles.postInfo}>
                  <time>
                    <CalendarIcon />
                    {format(new Date(post.first_publication_date), 'd MMM y', {
                      locale: ptBR,
                    })}
                  </time>
                  <p>
                    <UserIcon />
                    {post.data.author}
                  </p>
                </div>
              </a>
            </Link>
          ))}
          {storePosts.next_page !== null ? (
            <button
              type="button"
              className={styles.loadingButton}
              onClick={() => handleMorePosts(storePosts.next_page)}
              title="Carregar mais posts"
            >
              Carregar mais posts
            </button>
          ) : null}
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 2,
      orderings: '[posts.first_publication_date desc]',
    }
  );

  const postsResult = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
      first_publication_date: post.first_publication_date,
    };
  });

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: postsResult,
      },
    },
  };
};
