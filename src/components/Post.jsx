import "react-lazy-load-image-component/src/effects/blur.css";

import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  styled,
  useMediaQuery,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

import CommentIcon from "@mui/icons-material/Comment";
import DeleteTwoToneIcon from "@mui/icons-material/DeleteTwoTone";
import DialogBox from "../reusableComponents/DialogBox";
import EmojiPicker from "emoji-picker-react";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteOutlinedIcon from "@mui/icons-material/FavoriteOutlined";
import ImageSlider from "../reusableComponents/ImageSlider";
import MoreHorizOutlinedIcon from "@mui/icons-material/MoreHorizOutlined";
import ReadMore from "./ReadMore";
import ReplyRoundedIcon from "@mui/icons-material/ReplyRounded";
import Scroll from "../reusableComponents/Scroll";
import SentimentSatisfiedAltOutlinedIcon from "@mui/icons-material/SentimentSatisfiedAltOutlined";
import { db } from "../lib/firebase";
import firebase from "firebase/compat/app";
import { red } from "@mui/material/colors";
import { useTheme } from "@mui/material/styles";

const ITEM_HEIGHT = 48;

function Post(prop) {
  const { postId, user, post, shareModal, setLink, setPostText } = prop;
  const { username, caption, imageUrl, avatar, likecount } = post;
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState("");
  const [likesNo, setLikesNo] = useState(likecount ? likecount.length : 0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [showEmojis, setShowEmojis] = useState(false);
  const [Open, setOpen] = useState(false);
  const [isCommentOpen, setisCommentOpen] = useState(false);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));
  const open = Boolean(anchorEl);
  const docRef = doc(db, "posts", postId);
  const navigate = useNavigate();

  useEffect(() => {
    let unsubscribe;

    if (postId) {
      unsubscribe = db
        .collection("posts")
        .doc(postId)
        .collection("comments")
        .orderBy("timestamp", "desc")
        .onSnapshot((snapshot) => {
          setComments(
            snapshot.docs.map((doc) => ({
              id: doc.id,
              content: doc.data(),
            }))
          );
        });
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [postId]);

  const Item = styled(Paper)(({ theme }) => ({
    backgroundColor: theme.palette.mode === "dark" ? "#1A2027" : "#fff",
    ...theme.typography.body2,
    padding: theme.spacing(1),
    textAlign: "center",
    color: theme.palette.text.secondary,
  }));

  const postComment = (event) => {
    event.preventDefault();
    db.collection("posts").doc(postId).collection("comments").add({
      text: comment,
      username: user.displayName,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    });
    setComment("");
  };

  const deleteComment = async (event, commentRef) => {
    event.preventDefault();
    await db
      .collection("posts")
      .doc(postId)
      .collection("comments")
      .doc(commentRef.id)
      .delete();
  };

  const onEmojiClick = (emojiObject, event) => {
    setComment((prevInput) => prevInput + emojiObject.emoji);
    setShowEmojis(false);
  };

  /**
   * @type {{
   *     imageUrl: null|string,
   *     imageWidth: number,
   *     imageHeight: number,
   *     thumbnail: null | string
   * }[]}
   *
   */
  let postImages;

  try {
    postImages = JSON.parse(imageUrl);
  } catch {
    postImages = imageUrl.split(",").map((url) => ({
      imageUrl: url,
      imageWidth: 0,
      imageHeight: 0,
      thumbnail: null,
    }));
  }

  // const computeGridSize = (imagesLength, imageIndex) => {
  //   if (imageIndex === imagesLength - 1 && (imageIndex + 1) % 2 !== 0) {
  //     return 12;
  //   }
  //   return 6;
  // };

  const postHasImages = postImages.some((image) => Boolean(image.imageUrl));
  const tempLikeCount = likecount ? [...likecount] : [];
  const buttonStyle = {
    ":hover": {
      color: "#ff4d4d",
      fontSize: "29px",
    },
  };

  async function likesHandler() {
    if (user && likecount !== undefined) {
      let ind = tempLikeCount.indexOf(user.uid);

      if (ind !== -1) {
        tempLikeCount.splice(ind, 1);
        setLikesNo((currLikesNo) => currLikesNo - 1);
      } else {
        tempLikeCount.push(user.uid);
        setLikesNo((currLikesNo) => currLikesNo + 1);
      }

      // console.log(tempLikeCount);
      const data = {
        likecount: tempLikeCount,
      };
      await updateDoc(docRef, data)
        // .then((docRef) => {
        //   console.log("like added");
        // })
        .catch((error) => {
          // console.log(error);
        });
    }
  }

  async function deletePost() {
    await db.collection("posts").doc(postId).delete();
  }

  const handleClickOpen = () => {
    setOpen(true);
    setAnchorEl(null);
  };

  // const handleCommentOpen = () => {
  //   setisCommentOpen(true);
  // };

  const handleClose = () => {
    setOpen(false);
  };

  const handleCommentClose = () => {
    setisCommentOpen(false);
  };

  return (
    <div
      className="post"
      style={{ boxShadow: "0px 0px 5px 1px rgba(0, 0, 0, 0.4)" }}
    >
      <div className="post__header">
        <Avatar
          className="post__avatar"
          alt={username}
          src={avatar}
          sx={{
            bgcolor: "royalblue",
            border: "2px solid transparent",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            cursor: "pointer",
            "&:hover": {
              boxShadow: "rgba(100, 100, 111, 0.2) 0px 7px 17px 0px",
              border: "2px solid black",
              scale: "1.1",
            },
          }}
          onClick={() => {
            navigate("/dummygram/profile", {
              state: {
                name: username,
                avatar: avatar,
              },
            });
          }}
        />
        <Link
          to={`/dummygram/posts/${postId}`}
          style={{ textDecoration: "none" }}
        >
          <h3 className="post__username">{username}</h3>
        </Link>
        <div className="social__icon__last">
          <IconButton
            aria-label="more"
            id="long-button"
            aria-controls={open ? "long-menu" : undefined}
            aria-expanded={open ? "true" : undefined}
            aria-haspopup="true"
            onClick={(event) => setAnchorEl(event.currentTarget)}
            sx={{
              color: "var(--color)",
            }}
          >
            <MoreHorizOutlinedIcon />
          </IconButton>
          {user && username == user.displayName && (
            <Menu
              id="long-menu"
              MenuListProps={{
                "aria-labelledby": "long-button",
              }}
              anchorEl={anchorEl}
              open={open}
              onClose={() => setAnchorEl(null)}
              PaperProps={{
                style: {
                  maxHeight: ITEM_HEIGHT * 4.5,
                  width: "20ch",
                },
              }}
            >
              <MenuItem onClick={handleClickOpen}> Delete </MenuItem>
            </Menu>
          )}
          <Dialog
            fullScreen={fullScreen}
            open={Open}
            onClose={handleClose}
            aria-labelledby="responsive-dialog-title"
          >
            <DialogTitle id="responsive-dialog-title">
              {"Delete Post?"}
            </DialogTitle>
            <DialogContent>
              <DialogContentText>
                Are you sure you want to delete this post?
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose}>Cancel</Button>
              <Button onClick={deletePost}>Delete</Button>
            </DialogActions>
          </Dialog>
        </div>
      </div>
      <div className="post__container">
        {postHasImages ? (
          <ImageSlider slides={postImages} isCommentBox={false} />
        ) : (
          <div className="post__background">
            <p className="post_caption">{caption}</p>
          </div>
        )}
        <div className="post__text">
          {caption && postHasImages && (
            <>
              <strong style={{ color: "royalblue" }}>{username} </strong>
              <ReadMore caption={caption} />
            </>
          )}
        </div>
        {user && (
          <form className="post__commentBox">
            <div className="social__icon">
              <SentimentSatisfiedAltOutlinedIcon
                onClick={() => {
                  setShowEmojis((val) => !val);
                }}
              />
              {showEmojis && (
                <div id="picker">
                  <EmojiPicker
                    emojiStyle="native"
                    height={330}
                    searchDisabled
                    onEmojiClick={onEmojiClick}
                    previewConfig={{
                      showPreview: false,
                    }}
                  />
                </div>
              )}
            </div>
            <input
              className="post__input"
              type="text"
              placeholder="Add a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              style={{
                backgroundColor: "var(--bg-color)",
                color: "var(--color)",
                borderRadius: "22px",
                margin: "4px 0px",
              }}
            />
            <button
              className="post__button"
              disabled={!comment}
              type="submit"
              onClick={postComment}
              style={{
                fontWeight: "bold",
                textTransform: "uppercase",
              }}
            >
              Post
            </button>

            <>
              <div className="social__icons__wrapper">
                <div
                  className="social__icon"
                  onClick={likesHandler}
                  style={{ cursor: "pointer" }}
                >
                  {user ? (
                    tempLikeCount.indexOf(user.uid) != -1 ? (
                      <FavoriteOutlinedIcon
                        sx={{ color: red[500], fontSize: "30px" }}
                      />
                    ) : (
                      <FavoriteBorderIcon sx={buttonStyle} />
                    )
                  ) : (
                    <FavoriteBorderIcon sx={buttonStyle} />
                  )}
                </div>

                <span style={{ marginLeft: "", fontWeight: "bold" }}>
                  {likecount !== 0 ? `${likesNo} Likes` : " "}{" "}
                  {/* <span style={{ fontWeight: "bold" }}>Likes</span> */}
                </span>

                <IconButton
                  aria-label="share"
                  id="share-button"
                  aria-haspopup="true"
                  onClick={() => {
                    setLink(`https://narayan954.github.io/dummygram/${postId}`);
                    setPostText(caption);
                    shareModal(true);
                  }}
                  sx={{
                    color: "var(--color)",
                    marginX: "4px",
                  }}
                >
                  <ReplyRoundedIcon htmlColor="var(--color)" />
                </IconButton>

                {/* comment button */}
                {/* <div className="social__icon">
            <ModeCommentOutlinedIcon />
          </div> */}
                {/* share button */}
                {/* <div className="social__icon">
            <SendOutlinedIcon />
          </div> */}
                {/* save button */}
                {/* <div className="social__icon__last">
            <BookmarkBorderOutlinedIcon />
          </div> */}
              </div>
              <Button
                onClick={() => {
                  setisCommentOpen(!Open);
                }}
                startIcon={<CommentIcon />}
                sx={{
                  backgroundColor: "rgba(	135, 206, 235, 0.2)",
                  margin: "12px 8px",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              >
                View All comments
              </Button>

              <DialogBox
                open={isCommentOpen}
                onClose={handleCommentClose}
                title="All Comments"
              >
                <Box sx={{ flexGrow: 1 }}>
                  <Grid container>
                    <Grid item xs={6} md={6}>
                      <Item>
                        {postHasImages ? (
                          <ImageSlider slides={postImages} isCommentBox />
                        ) : (
                          <div className="post__background">
                            <p className="post_caption">{caption}</p>
                          </div>
                        )}
                      </Item>
                    </Grid>
                    <Grid item xs={6} md={6}>
                      <Scroll>
                        <Item>
                          {comments.length ? (
                            <div className="post__comments">
                              {comments.map((userComment) => (
                                <p key={userComment.id}>
                                  <strong>
                                    {userComment.content.username}
                                  </strong>{" "}
                                  {userComment.content.text}
                                  <span
                                    onClick={(event) =>
                                      deleteComment(event, userComment)
                                    }
                                  >
                                    {user &&
                                    userComment.content.username ===
                                      user.displayName ? (
                                      <DeleteTwoToneIcon fontSize="small" />
                                    ) : (
                                      <></>
                                    )}
                                  </span>
                                  <hr />
                                </p>
                              ))}
                            </div>
                          ) : (
                            <span>No Comments</span>
                          )}
                        </Item>
                      </Scroll>
                    </Grid>
                  </Grid>
                </Box>

                {user && (
                  <form className="post__commentBox">
                    <div className="social__icon">
                      <SentimentSatisfiedAltOutlinedIcon
                        onClick={() => {
                          setShowEmojis((val) => !val);
                        }}
                      />
                      {showEmojis && (
                        <div id="picker">
                          <EmojiPicker
                            emojiStyle="native"
                            height={330}
                            searchDisabled
                            onEmojiClick={onEmojiClick}
                            previewConfig={{
                              showPreview: false,
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <input
                      className="post__input"
                      type="text"
                      placeholder="Add a comment..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      style={{
                        backgroundColor: "var(--bg-color)",
                        color: "var(--color)",
                        borderRadius: "22px",
                        marginTop: "4px",
                      }}
                    />
                    <button
                      className="post__button"
                      disabled={!comment}
                      type="submit"
                      onClick={postComment}
                      style={{
                        fontWeight: "bold",
                        textTransform: "uppercase",
                      }}
                    >
                      Comment
                    </button>
                  </form>
                )}
              </DialogBox>
            </>
          </form>
        )}
      </div>
    </div>
  );
}

export default Post;
