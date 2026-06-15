-- Week 2: RAG storage. Run this in the Supabase SQL editor.
create extension if not exists vector;

create table if not exists documents (
  id bigint generated always as identity primary key,
  filename text not null,
  created_at timestamptz not null default now()
);

create table if not exists chunks (
  id bigint generated always as identity primary key,
  document_id bigint not null references documents (id) on delete cascade,
  content text not null,
  page int,
  -- 1024 dims = voyage-3 / multilingual-e5-large; change to match your embedding model
  embedding vector(1024) not null
);

create index if not exists chunks_embedding_idx
  on chunks using hnsw (embedding vector_cosine_ops);

-- Top-k similarity search used by the /api/ask route
create or replace function match_chunks (
  query_embedding vector(1024),
  match_count int default 5,
  filter_document_id bigint default null
)
returns table (id bigint, document_id bigint, content text, page int, similarity float)
language sql stable as $$
  select c.id, c.document_id, c.content, c.page,
         1 - (c.embedding <=> query_embedding) as similarity
  from chunks c
  where filter_document_id is null or c.document_id = filter_document_id
  order by c.embedding <=> query_embedding
  limit match_count;
$$;
