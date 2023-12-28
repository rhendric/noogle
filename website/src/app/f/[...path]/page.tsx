import { HighlightBaseline } from "@/components/HighlightBaseline";
import { ShareButton } from "@/components/ShareButton";
import { BackButton } from "@/components/BackButton";
import { Doc, FilePosition, data } from "@/models/data";
import { getPrimopDescription } from "@/models/primop";
import { extractHeadings, mdxRenderOptions } from "@/utils";
import { Edit } from "@mui/icons-material";
import { Box, Button, Divider, Typography, Link, Chip } from "@mui/material";
import { MDXRemote } from "next-mdx-remote/rsc";
import { findType, interpretType } from "@/models/nix";
import LinkIcon from "@mui/icons-material/Link";

// Important the key ("path") in the returned dict MUST match the dynamic path segment ([...path])
export async function generateStaticParams(): Promise<{ path: string[] }[]> {
  const paths = data.map((docItem) => {
    return {
      path: docItem.meta.path.map((s) => s),
    };
  });
  return paths;
}

const getSourcePosition = (baseUrl: string, position: FilePosition): string => {
  const filename = position?.file.split("/").slice(4).join("/");
  const line = position?.line;
  const column = position?.column;
  let res = `${baseUrl}`;
  if (filename && line && column) {
    res += `/${filename}#L${line}:C${column}`;
  }
  return res;
};

interface TocProps {
  mdxSource: string;
}

const Toc = async (props: TocProps) => {
  const { mdxSource } = props;
  const headings = await extractHeadings(mdxSource);

  return (
    <Box
      data-pagefind-ignore="all"
      sx={{
        display: {
          xs: "none",
          lg: "block",
        },
        position: "fixed",
        top: "6rem",
        right: "1.8em",
        whiteSpace: "nowrap",
      }}
    >
      <Typography variant="subtitle1">Table of Contents</Typography>
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        {headings.map((h, idx) => (
          <Link key={idx} href={`#${h.id}`}>
            <Typography
              variant="body2"
              sx={{
                justifyContent: "start",
                textTransform: "none",
                color: "text.secondary",
                pl: (h.level - 1) * 2 + 1,
                py: 0.5,
              }}
            >
              {h.value}
            </Typography>
          </Link>
        ))}
      </Box>
    </Box>
  );
};

// Multiple versions of this page will be statically generated
// using the `params` returned by `generateStaticParams`
export default async function Page(props: { params: { path: string[] } }) {
  const { params } = props;
  const item: Doc | undefined = data.find(
    (item) => item.meta.path.join(".") === params.path.join(".")
  );
  const mdxSource = item?.content?.content || "";
  const meta = item?.meta;

  const { args: argTypes, returns: retTypes } = interpretType(
    meta?.path[meta?.path?.length - 1],
    meta?.signature || (item && findType(item)) || ""
  );

  console.log(meta);

  const position =
    meta?.content_meta?.position ||
    meta?.attr_position ||
    (meta?.count_applied == 0 && meta?.lambda_position);

  const raw_position =
    meta?.content_meta?.position ||
    meta?.attr_position ||
    meta?.lambda_position;

  const source =
    meta?.is_primop && meta?.primop_meta
      ? getPrimopDescription(meta.primop_meta) + mdxSource
      : mdxSource;

  return (
    <>
      <Toc mdxSource={mdxSource} />
      <Box
        component="main"
        data-pagefind-body
        sx={{
          maxWidth: "100vw",
          overflow: "hidden",
          p: { xs: 1, md: 2 },
          bgcolor: "background.paper",
        }}
      >
        <HighlightBaseline />
        <Box>
          <Box sx={{ display: "flex" }}>
            <BackButton />
            <Typography
              variant="h2"
              component={"h1"}
              sx={{ marginRight: "auto" }}
            >
              {item?.meta.title}
            </Typography>
            {meta?.is_primop && meta.count_applied == 0 && (
              <>
                <Chip
                  label="Primop"
                  color="primary"
                  sx={{ ml: 2, maxWidth: "10rem" }}
                />
                {meta?.primop_meta?.experimental && (
                  <Chip
                    label={"Experimental"}
                    color="warning"
                    sx={{ ml: 2, maxWidth: "10rem" }}
                  />
                )}
              </>
            )}
            <ShareButton />
          </Box>
          <Divider flexItem sx={{ mt: 2 }} />
          <Box sx={{ display: "block" }}>
            {argTypes.map((t, i) => (
              <meta key={i} data-pagefind-filter={`from:${t}`} />
            ))}
            {retTypes.map((t, i) => (
              <meta key={i} data-pagefind-filter={`to:${t}`} />
            ))}
          </Box>

          {!source && (
            <Box data-pagefind-ignore="all">
              <Typography
                variant="body1"
                sx={{ color: "text.secondary", py: 2 }}
              >
                No documentation found yet.
              </Typography>
              {!position && (
                <div data-pagefind-ignore="all">
                  <Typography variant="h5" sx={{ pt: 2 }}>
                    Noogle's tip
                  </Typography>
                  <Typography variant="body1" gutterBottom sx={{ py: 2 }}>
                    <p>
                      Position of the source could not be detected
                      automatically.
                    </p>
                    <p>
                      Sometimes the documentation is missing or the extraction
                      of the documentation fails. In these cases, it is
                      advisable to look for the recognized position in the
                      source code
                    </p>
                    {raw_position && (
                      <Link
                        target="_blank"
                        href={getSourcePosition(
                          "https://github.com/hsjobeki/nixpkgs/tree/migrate-doc-comments",
                          raw_position
                        )}
                      >
                        <Button
                          data-pagefind-ignore="all"
                          variant="text"
                          sx={{
                            textTransform: "none",
                            my: 1,
                            placeSelf: "start",
                          }}
                          startIcon={<LinkIcon />}
                        >
                          Original/underlying function
                        </Button>
                      </Link>
                    )}
                    <p>You may find further instructions there</p>
                  </Typography>
                </div>
              )}
            </Box>
          )}
          <MDXRemote
            options={{
              parseFrontmatter: true,
              mdxOptions: mdxRenderOptions,
            }}
            source={source}
            components={{
              a: (p) => (
                // @ts-ignore
                <Box
                  sx={{
                    color: "inherit",
                    textDecoration: "none",
                  }}
                  component="a"
                  {...p}
                />
              ),
              // @ts-ignore
              h1: (p) => (
                // @ts-ignore
                <Typography variant="h3" component={"h2"} {...p} />
              ),
              // @ts-ignore
              h2: (p) => <Typography variant="h4" component={"h3"} {...p} />,
              // @ts-ignore
              h3: (p) => <Typography variant="h5" component={"h4"} {...p} />,
              // @ts-ignore
              h4: (p) => <Typography variant="h6" component={"h5"} {...p} />,
              // @ts-ignore
              h5: (p) => (
                // @ts-ignore
                <Typography variant="subtitle1" component={"h6"} {...p} />
              ),
              // @ts-ignore
              h6: (p) => (
                // @ts-ignore
                <Typography variant="subtitle2" component={"h6"} {...p} />
              ),
            }}
          />
          {position && (
            <div data-pagefind-ignore="all">
              {!source && (
                <Typography
                  variant="body1"
                  sx={{ color: "text.secondary", py: 2 }}
                >
                  Contribute now!
                </Typography>
              )}
              <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
                <Link
                  target="_blank"
                  href={getSourcePosition(
                    "https://github.com/hsjobeki/nixpkgs/tree/migrate-doc-comments",
                    position
                  )}
                >
                  <Button
                    variant="text"
                    sx={{ textTransform: "none", my: 1, placeSelf: "start" }}
                    startIcon={<Edit />}
                  >
                    Edit source
                  </Button>
                </Link>
              </Typography>
            </div>
          )}
          {!!meta?.aliases?.length && (
            <div data-pagefind-ignore="all">
              <Divider flexItem />
              <Typography
                variant="subtitle1"
                component={"h3"}
                sx={{
                  color: "text.secondary",
                  alignSelf: "center",
                  pb: 2,
                }}
              >
                Noogle also knows
              </Typography>

              <Typography variant="h5" component={"h3"}>
                Aliases
              </Typography>
              <ul>
                {meta?.aliases?.map((a) => (
                  <li key={a.join(".")}>
                    <Link href={`/f/${a.join("/")}`}>{a.join(".")}</Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Box>
      </Box>
    </>
  );
}
