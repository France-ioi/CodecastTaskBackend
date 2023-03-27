
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

--
-- Table structure for table `error_log`
--

CREATE TABLE `error_log` (
  `ID` int NOT NULL,
  `date` datetime NOT NULL,
  `message` longtext NOT NULL,
  `browser` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `history_test_sync_main`
--

CREATE TABLE `history_test_sync_main` (
  `historyID` bigint NOT NULL,
  `ID` bigint NOT NULL,
  `secondID` bigint NOT NULL,
  `sFieldA` varchar(30) NOT NULL,
  `iFieldB` int NOT NULL,
  `iVersion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `iNextVersion` timestamp NULL DEFAULT NULL,
  `bDeleted` tinyint NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `history_test_sync_second`
--

CREATE TABLE `history_test_sync_second` (
  `historyID` bigint NOT NULL,
  `ID` bigint NOT NULL,
  `thirdID` bigint NOT NULL,
  `sFieldA` varchar(30) NOT NULL,
  `iVersion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `iNextVersion` timestamp NULL DEFAULT NULL,
  `bDeleted` tinyint NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `history_test_sync_third`
--

CREATE TABLE `history_test_sync_third` (
  `historyID` bigint NOT NULL,
  `ID` bigint NOT NULL,
  `mainID` bigint NOT NULL,
  `iFieldB` int NOT NULL,
  `iVersion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `iNextVersion` timestamp NULL DEFAULT NULL,
  `bDeleted` tinyint NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `history_tm_hints`
--

CREATE TABLE `history_tm_hints` (
  `historyID` bigint NOT NULL,
  `ID` bigint NOT NULL,
  `idTask` bigint NOT NULL,
  `iRank` tinyint NOT NULL,
  `iVersion` int NOT NULL DEFAULT '0',
  `iNextVersion` int DEFAULT NULL,
  `bDeleted` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `history_tm_hints_strings`
--

CREATE TABLE `history_tm_hints_strings` (
  `historyID` bigint NOT NULL,
  `ID` bigint NOT NULL,
  `idHint` bigint NOT NULL,
  `sLanguage` varchar(5) NOT NULL DEFAULT 'fr',
  `sTranslator` varchar(100) NOT NULL,
  `sContent` mediumtext NOT NULL,
  `iVersion` int NOT NULL DEFAULT '0',
  `iNextVersion` int DEFAULT NULL,
  `bDeleted` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `history_tm_recordings`
--

CREATE TABLE `history_tm_recordings` (
  `historyID` bigint NOT NULL,
  `ID` bigint NOT NULL,
  `idUser` bigint NOT NULL,
  `idPlatform` bigint NOT NULL,
  `idTask` bigint NOT NULL,
  `sData` mediumtext,
  `sDateCreation` datetime NOT NULL,
  `iVersion` int NOT NULL,
  `iNextVersion` int DEFAULT NULL,
  `bDeleted` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `history_tm_solutions`
--

CREATE TABLE `history_tm_solutions` (
  `historyID` bigint NOT NULL,
  `ID` bigint NOT NULL,
  `idTask` bigint NOT NULL,
  `bInSolution` tinyint(1) NOT NULL DEFAULT '0',
  `sLangProg` varchar(10) NOT NULL,
  `sGroup` varchar(50) DEFAULT NULL,
  `sAuthor` varchar(50) NOT NULL,
  `iVersion` int NOT NULL,
  `iNextVersion` int DEFAULT NULL,
  `bDeleted` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `history_tm_solutions_strings`
--

CREATE TABLE `history_tm_solutions_strings` (
  `historyID` bigint NOT NULL,
  `ID` bigint NOT NULL,
  `idSolution` bigint NOT NULL,
  `sLanguage` varchar(5) NOT NULL,
  `sTranslator` varchar(50) DEFAULT NULL,
  `sSource` mediumtext NOT NULL,
  `iVersion` int NOT NULL,
  `iNextVersion` int DEFAULT NULL,
  `bDeleted` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `history_tm_source_codes`
--

CREATE TABLE `history_tm_source_codes` (
  `historyID` bigint NOT NULL,
  `ID` bigint NOT NULL,
  `idUser` bigint NOT NULL,
  `idPlatform` bigint NOT NULL,
  `idTask` bigint NOT NULL,
  `sDate` datetime NOT NULL,
  `sParams` tinytext,
  `sName` varchar(250) NOT NULL,
  `sSource` mediumtext NOT NULL,
  `bEditable` tinyint(1) NOT NULL,
  `bSubmission` tinyint(1) NOT NULL,
  `sType` enum('User','Submission','Task','Solution','Hint') NOT NULL DEFAULT 'User',
  `bActive` tinyint(1) NOT NULL DEFAULT '0',
  `iRank` tinyint NOT NULL DEFAULT '0',
  `iVersion` int NOT NULL,
  `iNextVersion` int DEFAULT NULL,
  `bDeleted` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `history_tm_submissions`
--

CREATE TABLE `history_tm_submissions` (
  `historyID` bigint NOT NULL,
  `ID` bigint NOT NULL,
  `idUser` bigint NOT NULL,
  `idPlatform` bigint NOT NULL,
  `idTask` bigint NOT NULL COMMENT 'Problem''s ID',
  `sDate` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `idSourceCode` bigint NOT NULL,
  `bManualCorrection` tinyint NOT NULL DEFAULT '0',
  `bSuccess` tinyint NOT NULL DEFAULT '0',
  `nbTestsTotal` int NOT NULL DEFAULT '0',
  `nbTestsPassed` int NOT NULL DEFAULT '0',
  `iScore` int NOT NULL DEFAULT '0',
  `bCompilError` tinyint NOT NULL DEFAULT '0',
  `sCompilMsg` mediumtext,
  `sErrorMsg` mediumtext,
  `sFirstUserOutput` mediumtext,
  `sFirstExpectedOutput` mediumtext,
  `sManualScoreDiffComment` varchar(255) DEFAULT NULL,
  `bEvaluated` tinyint NOT NULL DEFAULT '0',
  `bConfirmed` tinyint NOT NULL DEFAULT '0' COMMENT '0 when saved for getAnswer, 1 once the grade process starts',
  `sMode` enum('Submitted','LimitedTime','Contest','UserTest') NOT NULL DEFAULT 'Submitted',
  `sReturnUrl` varchar(255) DEFAULT NULL,
  `idUserAnswer` varchar(50) DEFAULT NULL,
  `iChecksum` int NOT NULL DEFAULT '0',
  `iVersion` int NOT NULL,
  `iNextVersion` int DEFAULT NULL,
  `bDeleted` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `history_tm_submissions_subtasks`
--

CREATE TABLE `history_tm_submissions_subtasks` (
  `historyID` bigint NOT NULL,
  `ID` bigint NOT NULL,
  `bSuccess` tinyint(1) NOT NULL,
  `iScore` tinyint NOT NULL,
  `idSubtask` bigint NOT NULL,
  `idSubmission` bigint NOT NULL,
  `iVersion` int NOT NULL,
  `iNextVersion` int DEFAULT NULL,
  `bDeleted` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `history_tm_submissions_tests`
--

CREATE TABLE `history_tm_submissions_tests` (
  `historyID` bigint NOT NULL,
  `ID` bigint NOT NULL,
  `idSubmission` bigint NOT NULL DEFAULT '0',
  `idTest` bigint NOT NULL DEFAULT '0',
  `iScore` tinyint NOT NULL DEFAULT '0',
  `iTimeMs` int NOT NULL DEFAULT '0',
  `iMemoryKb` int NOT NULL DEFAULT '0',
  `iErrorCode` int NOT NULL DEFAULT '0',
  `sOutput` mediumtext,
  `sExpectedOutput` mediumtext,
  `sErrorMsg` mediumtext,
  `sLog` mediumtext,
  `bNoFeedback` tinyint(1) NOT NULL DEFAULT '0',
  `jFiles` mediumtext,
  `idSubmissionSubtask` bigint DEFAULT NULL,
  `iVersion` int NOT NULL,
  `iNextVersion` int DEFAULT NULL,
  `bDeleted` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `history_tm_tasks`
--

CREATE TABLE `history_tm_tasks` (
  `historyID` bigint NOT NULL,
  `ID` bigint NOT NULL,
  `sTextId` varchar(100) NOT NULL,
  `sSupportedLangProg` varchar(255) NOT NULL DEFAULT '*',
  `sEvalTags` varchar(255) NOT NULL DEFAULT '',
  `sAuthor` varchar(100) NOT NULL,
  `sAuthorSolution` varchar(100) NOT NULL,
  `bShowLimits` tinyint(1) NOT NULL DEFAULT '1',
  `bEditorInStatement` tinyint(1) NOT NULL DEFAULT '0',
  `bUserTests` tinyint(1) NOT NULL DEFAULT '1',
  `bChecked` tinyint(1) NOT NULL DEFAULT '0',
  `iEvalMode` tinyint(1) NOT NULL DEFAULT '0',
  `bUsesLibrary` tinyint(1) NOT NULL,
  `bUseLatex` tinyint(1) NOT NULL DEFAULT '0',
  `iTestsMinSuccessScore` tinyint NOT NULL DEFAULT '100',
  `bIsEvaluable` tinyint(1) NOT NULL DEFAULT '1',
  `sTemplateName` varchar(100) NOT NULL DEFAULT '',
  `sScriptAnimation` text,
  `sDefaultEditorMode` enum('simple','normal','expert','') NOT NULL DEFAULT 'normal',
  `sEvalResultOutputScript` varchar(50) DEFAULT NULL,
  `bTestMode` tinyint(1) NOT NULL DEFAULT '0',
  `sTaskPath` varchar(100) NOT NULL COMMENT 'taskPath as documented in taskgrader',
  `sRevision` varchar(100) DEFAULT NULL,
  `sAssetsBaseUrl` varchar(250) DEFAULT NULL,
  `iVersion` int NOT NULL,
  `iNextVersion` int DEFAULT NULL,
  `bDeleted` tinyint(1) NOT NULL,
  `bHasSubtasks` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `history_tm_tasks_limits`
--

CREATE TABLE `history_tm_tasks_limits` (
  `historyID` bigint NOT NULL,
  `ID` bigint NOT NULL,
  `idTask` bigint NOT NULL,
  `sLangProg` varchar(255) NOT NULL DEFAULT '*',
  `iMaxTime` int NOT NULL DEFAULT '10000' COMMENT 'max allowed time in ms',
  `iMaxMemory` int NOT NULL COMMENT 'max allowed memory in kb',
  `iVersion` int NOT NULL,
  `iNextVersion` int DEFAULT NULL,
  `bDeleted` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `history_tm_tasks_strings`
--

CREATE TABLE `history_tm_tasks_strings` (
  `historyID` bigint NOT NULL,
  `ID` bigint NOT NULL,
  `idTask` bigint NOT NULL,
  `sLanguage` varchar(5) NOT NULL,
  `sTitle` varchar(100) NOT NULL,
  `sTranslator` varchar(100) NOT NULL,
  `sStatement` mediumtext NOT NULL,
  `sSolution` mediumtext,
  `iVersion` int NOT NULL DEFAULT '0',
  `iNextVersion` int DEFAULT NULL,
  `bDeleted` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `history_tm_tasks_subtasks`
--

CREATE TABLE `history_tm_tasks_subtasks` (
  `historyID` bigint NOT NULL,
  `ID` bigint NOT NULL,
  `idTask` bigint NOT NULL,
  `iRank` tinyint NOT NULL,
  `name` varchar(255) NOT NULL,
  `comments` text NOT NULL,
  `iPointsMax` tinyint NOT NULL,
  `bActive` tinyint(1) NOT NULL DEFAULT '1',
  `iVersion` int NOT NULL,
  `iNextVersion` int DEFAULT NULL,
  `bDeleted` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `history_tm_tasks_tests`
--

CREATE TABLE `history_tm_tasks_tests` (
  `historyID` bigint NOT NULL,
  `ID` bigint NOT NULL,
  `idTask` bigint NOT NULL,
  `idSubtask` bigint DEFAULT NULL,
  `idSubmission` bigint DEFAULT NULL,
  `sGroupType` enum('Example','User','Evaluation','Submission') NOT NULL DEFAULT 'User',
  `idUser` bigint DEFAULT NULL,
  `idPlatform` bigint DEFAULT NULL,
  `iRank` tinyint NOT NULL DEFAULT '0',
  `bActive` tinyint(1) NOT NULL DEFAULT '0',
  `sName` varchar(100) NOT NULL,
  `sInput` mediumtext,
  `sOutput` mediumtext,
  `iVersion` int NOT NULL DEFAULT '0',
  `iNextVersion` int DEFAULT NULL,
  `bDeleted` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `schema_revision`
--

CREATE TABLE `schema_revision` (
  `id` int UNSIGNED NOT NULL,
  `executed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `file` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `synchro_version`
--

CREATE TABLE `synchro_version` (
  `iVersion` int NOT NULL,
  `iLastServerVersion` int NOT NULL,
  `iLastClientVersion` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `test_sync_main`
--

CREATE TABLE `test_sync_main` (
  `ID` bigint NOT NULL,
  `secondID` bigint NOT NULL,
  `sFieldA` varchar(30) NOT NULL,
  `iFieldB` int NOT NULL,
  `iVersion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Triggers `test_sync_main`
--
DELIMITER $$
CREATE TRIGGER `after_insert_test_sync_main` AFTER INSERT ON `test_sync_main` FOR EACH ROW BEGIN INSERT INTO `history_test_sync_main` (`ID`,`iVersion`,`sFieldA`,`iFieldB`,`secondID`) VALUES (NEW.`ID`,@curVersion,NEW.`sFieldA`,NEW.`iFieldB`,NEW.`secondID`); END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_delete_test_sync_main` BEFORE DELETE ON `test_sync_main` FOR EACH ROW BEGIN SELECT (UNIX_TIMESTAMP() * 10) INTO @curVersion; UPDATE `history_test_sync_main` SET `iNextVersion` = @curVersion WHERE `ID` = OLD.`ID` AND `iNextVersion` IS NULL; INSERT INTO `history_test_sync_main` (`ID`,`iVersion`,`sFieldA`,`iFieldB`,`secondID`, `bDeleted`) VALUES (OLD.`ID`,@curVersion,OLD.`sFieldA`,OLD.`iFieldB`,OLD.`secondID`, 1); END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_insert_test_sync_main` BEFORE INSERT ON `test_sync_main` FOR EACH ROW BEGIN IF (NEW.ID IS NULL OR NEW.ID = 0) THEN SET NEW.ID = FLOOR(RAND() * 1000000000) + FLOOR(RAND() * 1000000000) * 1000000000; END IF ; SELECT (UNIX_TIMESTAMP() * 10) INTO @curVersion;SET NEW.iVersion = @curVersion; END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_update_test_sync_main` BEFORE UPDATE ON `test_sync_main` FOR EACH ROW BEGIN IF NEW.iVersion <> OLD.iVersion THEN SET @curVersion = NEW.iVersion; ELSE SELECT (UNIX_TIMESTAMP() * 10) INTO @curVersion; END IF; IF NOT (OLD.`ID` = NEW.`ID` AND OLD.`sFieldA` <=> NEW.`sFieldA` AND OLD.`iFieldB` <=> NEW.`iFieldB` AND OLD.`secondID` <=> NEW.`secondID`) THEN   SET NEW.iVersion = @curVersion;   UPDATE `history_test_sync_main` SET `iNextVersion` = @curVersion WHERE `ID` = OLD.`ID` AND `iNextVersion` IS NULL;   INSERT INTO `history_test_sync_main` (`ID`,`iVersion`,`sFieldA`,`iFieldB`,`secondID`)       VALUES (NEW.`ID`,@curVersion,NEW.`sFieldA`,NEW.`iFieldB`,NEW.`secondID`) ; END IF; END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `test_sync_second`
--

CREATE TABLE `test_sync_second` (
  `ID` bigint NOT NULL,
  `thirdID` bigint NOT NULL,
  `sFieldA` varchar(30) NOT NULL,
  `iVersion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Triggers `test_sync_second`
--
DELIMITER $$
CREATE TRIGGER `after_insert_test_sync_second` AFTER INSERT ON `test_sync_second` FOR EACH ROW BEGIN INSERT INTO `history_test_sync_second` (`ID`,`iVersion`,`sFieldA`,`thirdID`) VALUES (NEW.`ID`,@curVersion,NEW.`sFieldA`,NEW.`thirdID`); END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_delete_test_sync_second` BEFORE DELETE ON `test_sync_second` FOR EACH ROW BEGIN SELECT (UNIX_TIMESTAMP() * 10) INTO @curVersion; UPDATE `history_test_sync_second` SET `iNextVersion` = @curVersion WHERE `ID` = OLD.`ID` AND `iNextVersion` IS NULL; INSERT INTO `history_test_sync_second` (`ID`,`iVersion`,`sFieldA`,`thirdID`, `bDeleted`) VALUES (OLD.`ID`,@curVersion,OLD.`sFieldA`,OLD.`thirdID`, 1); END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_insert_test_sync_second` BEFORE INSERT ON `test_sync_second` FOR EACH ROW BEGIN IF (NEW.ID IS NULL OR NEW.ID = 0) THEN SET NEW.ID = FLOOR(RAND() * 1000000000) + FLOOR(RAND() * 1000000000) * 1000000000; END IF ; SELECT (UNIX_TIMESTAMP() * 10) INTO @curVersion;SET NEW.iVersion = @curVersion; END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_update_test_sync_second` BEFORE UPDATE ON `test_sync_second` FOR EACH ROW BEGIN IF NEW.iVersion <> OLD.iVersion THEN SET @curVersion = NEW.iVersion; ELSE SELECT (UNIX_TIMESTAMP() * 10) INTO @curVersion; END IF; IF NOT (OLD.`ID` = NEW.`ID` AND OLD.`sFieldA` <=> NEW.`sFieldA` AND OLD.`thirdID` <=> NEW.`thirdID`) THEN   SET NEW.iVersion = @curVersion;   UPDATE `history_test_sync_second` SET `iNextVersion` = @curVersion WHERE `ID` = OLD.`ID` AND `iNextVersion` IS NULL;   INSERT INTO `history_test_sync_second` (`ID`,`iVersion`,`sFieldA`,`thirdID`)       VALUES (NEW.`ID`,@curVersion,NEW.`sFieldA`,NEW.`thirdID`) ; END IF; END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `test_sync_third`
--

CREATE TABLE `test_sync_third` (
  `ID` bigint NOT NULL,
  `mainID` bigint NOT NULL,
  `iFieldB` int NOT NULL,
  `iVersion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Triggers `test_sync_third`
--
DELIMITER $$
CREATE TRIGGER `after_insert_test_sync_third` AFTER INSERT ON `test_sync_third` FOR EACH ROW BEGIN INSERT INTO `history_test_sync_third` (`ID`,`iVersion`,`iFieldB`,`mainID`) VALUES (NEW.`ID`,@curVersion,NEW.`iFieldB`,NEW.`mainID`); END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_delete_test_sync_third` BEFORE DELETE ON `test_sync_third` FOR EACH ROW BEGIN SELECT (UNIX_TIMESTAMP() * 10) INTO @curVersion; UPDATE `history_test_sync_third` SET `iNextVersion` = @curVersion WHERE `ID` = OLD.`ID` AND `iNextVersion` IS NULL; INSERT INTO `history_test_sync_third` (`ID`,`iVersion`,`iFieldB`,`mainID`, `bDeleted`) VALUES (OLD.`ID`,@curVersion,OLD.`iFieldB`,OLD.`mainID`, 1); END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_insert_test_sync_third` BEFORE INSERT ON `test_sync_third` FOR EACH ROW BEGIN IF (NEW.ID IS NULL OR NEW.ID = 0) THEN SET NEW.ID = FLOOR(RAND() * 1000000000) + FLOOR(RAND() * 1000000000) * 1000000000; END IF ; SELECT (UNIX_TIMESTAMP() * 10) INTO @curVersion;SET NEW.iVersion = @curVersion; END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_update_test_sync_third` BEFORE UPDATE ON `test_sync_third` FOR EACH ROW BEGIN IF NEW.iVersion <> OLD.iVersion THEN SET @curVersion = NEW.iVersion; ELSE SELECT (UNIX_TIMESTAMP() * 10) INTO @curVersion; END IF; IF NOT (OLD.`ID` = NEW.`ID` AND OLD.`iFieldB` <=> NEW.`iFieldB` AND OLD.`mainID` <=> NEW.`mainID`) THEN   SET NEW.iVersion = @curVersion;   UPDATE `history_test_sync_third` SET `iNextVersion` = @curVersion WHERE `ID` = OLD.`ID` AND `iNextVersion` IS NULL;   INSERT INTO `history_test_sync_third` (`ID`,`iVersion`,`iFieldB`,`mainID`)       VALUES (NEW.`ID`,@curVersion,NEW.`iFieldB`,NEW.`mainID`) ; END IF; END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `tm_grader_checks`
--

CREATE TABLE `tm_grader_checks` (
  `ID` bigint NOT NULL,
  `sDescription` mediumtext NOT NULL COMMENT 'TODO',
  `idTask` bigint DEFAULT NULL COMMENT 'TODO',
  `sParams` tinytext NOT NULL COMMENT 'TODO',
  `sSource` mediumtext NOT NULL COMMENT 'TODO',
  `sTestData` mediumtext NOT NULL COMMENT 'TODO',
  `iVersion` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `tm_hints`
--

CREATE TABLE `tm_hints` (
  `ID` bigint NOT NULL,
  `idTask` bigint NOT NULL,
  `iRank` tinyint NOT NULL,
  `iVersion` int NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Triggers `tm_hints`
--
DELIMITER $$
CREATE TRIGGER `after_insert_tm_hints` AFTER INSERT ON `tm_hints` FOR EACH ROW BEGIN INSERT INTO `history_tm_hints` (`ID`,`iVersion`,`idTask`,`iRank`) VALUES (NEW.`ID`,@curVersion,NEW.`idTask`,NEW.`iRank`); END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_delete_tm_hints` BEFORE DELETE ON `tm_hints` FOR EACH ROW BEGIN SELECT (UNIX_TIMESTAMP() * 10) INTO @curVersion; UPDATE `history_tm_hints` SET `iNextVersion` = @curVersion WHERE `ID` = OLD.`ID` AND `iNextVersion` IS NULL; INSERT INTO `history_tm_hints` (`ID`,`iVersion`,`idTask`,`iRank`, `bDeleted`) VALUES (OLD.`ID`,@curVersion,OLD.`idTask`,OLD.`iRank`, 1); END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_insert_tm_hints` BEFORE INSERT ON `tm_hints` FOR EACH ROW BEGIN IF (NEW.ID IS NULL OR NEW.ID = 0) THEN SET NEW.ID = FLOOR(RAND() * 1000000000) + FLOOR(RAND() * 1000000000) * 1000000000; END IF ; SELECT (UNIX_TIMESTAMP() * 10) INTO @curVersion;SET NEW.iVersion = @curVersion; END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_update_tm_hints` BEFORE UPDATE ON `tm_hints` FOR EACH ROW BEGIN IF NEW.iVersion <> OLD.iVersion THEN SET @curVersion = NEW.iVersion; ELSE SELECT (UNIX_TIMESTAMP() * 10) INTO @curVersion; END IF; IF NOT (OLD.`ID` = NEW.`ID` AND OLD.`idTask` <=> NEW.`idTask` AND OLD.`iRank` <=> NEW.`iRank`) THEN   SET NEW.iVersion = @curVersion;   UPDATE `history_tm_hints` SET `iNextVersion` = @curVersion WHERE `ID` = OLD.`ID` AND `iNextVersion` IS NULL;   INSERT INTO `history_tm_hints` (`ID`,`iVersion`,`idTask`,`iRank`)       VALUES (NEW.`ID`,@curVersion,NEW.`idTask`,NEW.`iRank`) ; END IF; END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `tm_hints_strings`
--

CREATE TABLE `tm_hints_strings` (
  `ID` bigint NOT NULL,
  `idHint` bigint NOT NULL,
  `sLanguage` varchar(5) NOT NULL DEFAULT 'fr',
  `sTranslator` varchar(100) NOT NULL,
  `sContent` mediumtext NOT NULL,
  `iVersion` int NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Triggers `tm_hints_strings`
--
DELIMITER $$
CREATE TRIGGER `after_insert_tm_hints_strings` AFTER INSERT ON `tm_hints_strings` FOR EACH ROW BEGIN INSERT INTO `history_tm_hints_strings` (`ID`,`iVersion`,`idHint`,`sLanguage`,`sTranslator`,`sContent`) VALUES (NEW.`ID`,@curVersion,NEW.`idHint`,NEW.`sLanguage`,NEW.`sTranslator`,NEW.`sContent`); END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_delete_tm_hints_strings` BEFORE DELETE ON `tm_hints_strings` FOR EACH ROW BEGIN SELECT (UNIX_TIMESTAMP() * 10) INTO @curVersion; UPDATE `history_tm_hints_strings` SET `iNextVersion` = @curVersion WHERE `ID` = OLD.`ID` AND `iNextVersion` IS NULL; INSERT INTO `history_tm_hints_strings` (`ID`,`iVersion`,`idHint`,`sLanguage`,`sTranslator`,`sContent`, `bDeleted`) VALUES (OLD.`ID`,@curVersion,OLD.`idHint`,OLD.`sLanguage`,OLD.`sTranslator`,OLD.`sContent`, 1); END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_insert_tm_hints_strings` BEFORE INSERT ON `tm_hints_strings` FOR EACH ROW BEGIN IF (NEW.ID IS NULL OR NEW.ID = 0) THEN SET NEW.ID = FLOOR(RAND() * 1000000000) + FLOOR(RAND() * 1000000000) * 1000000000; END IF ; SELECT (UNIX_TIMESTAMP() * 10) INTO @curVersion;SET NEW.iVersion = @curVersion; END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_update_tm_hints_strings` BEFORE UPDATE ON `tm_hints_strings` FOR EACH ROW BEGIN IF NEW.iVersion <> OLD.iVersion THEN SET @curVersion = NEW.iVersion; ELSE SELECT (UNIX_TIMESTAMP() * 10) INTO @curVersion; END IF; IF NOT (OLD.`ID` = NEW.`ID` AND OLD.`idHint` <=> NEW.`idHint` AND OLD.`sLanguage` <=> NEW.`sLanguage` AND OLD.`sTranslator` <=> NEW.`sTranslator` AND OLD.`sContent` <=> NEW.`sContent`) THEN   SET NEW.iVersion = @curVersion;   UPDATE `history_tm_hints_strings` SET `iNextVersion` = @curVersion WHERE `ID` = OLD.`ID` AND `iNextVersion` IS NULL;   INSERT INTO `history_tm_hints_strings` (`ID`,`iVersion`,`idHint`,`sLanguage`,`sTranslator`,`sContent`)       VALUES (NEW.`ID`,@curVersion,NEW.`idHint`,NEW.`sLanguage`,NEW.`sTranslator`,NEW.`sContent`) ; END IF; END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `tm_platforms`
--

CREATE TABLE `tm_platforms` (
  `ID` bigint NOT NULL,
  `name` varchar(255) NOT NULL,
  `public_key` varchar(500) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `tm_recordings`
--

CREATE TABLE `tm_recordings` (
  `ID` bigint NOT NULL,
  `idUser` bigint NOT NULL COMMENT 'user who created the recording',
  `idPlatform` bigint NOT NULL COMMENT 'platform on which the recording was created',
  `idTask` bigint NOT NULL,
  `sDateCreation` datetime NOT NULL,
  `sData` mediumtext,
  `iVersion` int NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Triggers `tm_recordings`
--
DELIMITER $$
CREATE TRIGGER `after_insert_tm_recordings` AFTER INSERT ON `tm_recordings` FOR EACH ROW BEGIN INSERT INTO `history_tm_recordings` (`ID`,`iVersion`,`idTask`,`idUser`,`idPlatform`,`sData`,`sDateCreation`) VALUES (NEW.`ID`,@curVersion,NEW.`idTask`,NEW.`idUser`,NEW.`idPlatform`,NEW.`sData`,NEW.`sDateCreation`); END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_delete_tm_recordings` BEFORE DELETE ON `tm_recordings` FOR EACH ROW BEGIN SELECT (UNIX_TIMESTAMP() * 10) INTO @curVersion; UPDATE `history_tm_recordings` SET `iNextVersion` = @curVersion WHERE `ID` = OLD.`ID` AND `iNextVersion` IS NULL; INSERT INTO `history_tm_recordings` (`ID`,`iVersion`,`idTask`,`idUser`,`idPlatform`,`sData`,`sDateCreation`, `bDeleted`) VALUES (OLD.`ID`,@curVersion,OLD.`idTask`,OLD.`idUser`,OLD.`idPlatform`,OLD.`sData`,OLD.`sDateCreation`, 1); END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_insert_tm_recordings` BEFORE INSERT ON `tm_recordings` FOR EACH ROW BEGIN IF (NEW.ID IS NULL OR NEW.ID = 0) THEN SET NEW.ID = FLOOR(RAND() * 1000000000) + FLOOR(RAND() * 1000000000) * 1000000000; END IF ; SELECT (UNIX_TIMESTAMP() * 10) INTO @curVersion;SET NEW.iVersion = @curVersion; END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_update_tm_recordings` BEFORE UPDATE ON `tm_recordings` FOR EACH ROW BEGIN IF NEW.iVersion <> OLD.iVersion THEN SET @curVersion = NEW.iVersion; ELSE SELECT (UNIX_TIMESTAMP() * 10) INTO @curVersion; END IF; IF NOT (OLD.`ID` = NEW.`ID` AND OLD.`idTask` <=> NEW.`idTask` AND OLD.`idUser` <=> NEW.`idUser` AND OLD.`idPlatform` <=> NEW.`idPlatform` AND OLD.`sData` <=> NEW.`sData` AND OLD.`sDateCreation` <=> NEW.`sDateCreation`) THEN   SET NEW.iVersion = @curVersion;   UPDATE `history_tm_recordings` SET `iNextVersion` = @curVersion WHERE `ID` = OLD.`ID` AND `iNextVersion` IS NULL;   INSERT INTO `history_tm_recordings` (`ID`,`iVersion`,`idTask`,`idUser`,`idPlatform`,`sData`,`sDateCreation`)       VALUES (NEW.`ID`,@curVersion,NEW.`idTask`,NEW.`idUser`,NEW.`idPlatform`,NEW.`sData`,NEW.`sDateCreation`) ; END IF; END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `tm_remote_secret`
--

CREATE TABLE `tm_remote_secret` (
  `idUser` bigint NOT NULL,
  `idPlatform` bigint NOT NULL,
  `sRemoteSecret` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `tm_solutions`
--

CREATE TABLE `tm_solutions` (
  `ID` bigint NOT NULL,
  `idTask` bigint NOT NULL,
  `bInSolution` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'solution is in the solution part of the task',
  `sLangProg` varchar(10) NOT NULL,
  `sGroup` varchar(50) NOT NULL,
  `sAuthor` varchar(50) NOT NULL,
  `iVersion` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Triggers `tm_solutions`
--
DELIMITER $$
CREATE TRIGGER `after_insert_tm_solutions` AFTER INSERT ON `tm_solutions` FOR EACH ROW BEGIN INSERT INTO `history_tm_solutions` (`ID`,`iVersion`,`idTask`,`bInSolution`,`sLangProg`,`sGroup`,`sAuthor`) VALUES (NEW.`ID`,@curVersion,NEW.`idTask`,NEW.`bInSolution`,NEW.`sLangProg`,NEW.`sGroup`,NEW.`sAuthor`); END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_delete_tm_solutions` BEFORE DELETE ON `tm_solutions` FOR EACH ROW BEGIN SELECT (UNIX_TIMESTAMP() * 10) INTO @curVersion; UPDATE `history_tm_solutions` SET `iNextVersion` = @curVersion WHERE `ID` = OLD.`ID` AND `iNextVersion` IS NULL; INSERT INTO `history_tm_solutions` (`ID`,`iVersion`,`idTask`,`bInSolution`,`sLangProg`,`sGroup`,`sAuthor`, `bDeleted`) VALUES (OLD.`ID`,@curVersion,OLD.`idTask`,OLD.`bInSolution`,OLD.`sLangProg`,OLD.`sGroup`,OLD.`sAuthor`, 1); END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_insert_tm_solutions` BEFORE INSERT ON `tm_solutions` FOR EACH ROW BEGIN IF (NEW.ID IS NULL OR NEW.ID = 0) THEN SET NEW.ID = FLOOR(RAND() * 1000000000) + FLOOR(RAND() * 1000000000) * 1000000000; END IF ; SELECT (UNIX_TIMESTAMP() * 10) INTO @curVersion;SET NEW.iVersion = @curVersion; END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_update_tm_solutions` BEFORE UPDATE ON `tm_solutions` FOR EACH ROW BEGIN IF NEW.iVersion <> OLD.iVersion THEN SET @curVersion = NEW.iVersion; ELSE SELECT (UNIX_TIMESTAMP() * 10) INTO @curVersion; END IF; IF NOT (OLD.`ID` = NEW.`ID` AND OLD.`idTask` <=> NEW.`idTask` AND OLD.`bInSolution` <=> NEW.`bInSolution` AND OLD.`sLangProg` <=> NEW.`sLangProg` AND OLD.`sGroup` <=> NEW.`sGroup` AND OLD.`sAuthor` <=> NEW.`sAuthor`) THEN   SET NEW.iVersion = @curVersion;   UPDATE `history_tm_solutions` SET `iNextVersion` = @curVersion WHERE `ID` = OLD.`ID` AND `iNextVersion` IS NULL;   INSERT INTO `history_tm_solutions` (`ID`,`iVersion`,`idTask`,`bInSolution`,`sLangProg`,`sGroup`,`sAuthor`)       VALUES (NEW.`ID`,@curVersion,NEW.`idTask`,NEW.`bInSolution`,NEW.`sLangProg`,NEW.`sGroup`,NEW.`sAuthor`) ; END IF; END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `tm_solutions_strings`
--

CREATE TABLE `tm_solutions_strings` (
  `ID` bigint NOT NULL,
  `idSolution` bigint NOT NULL,
  `sLanguage` varchar(5) NOT NULL,
  `sTranslator` varchar(50) DEFAULT NULL,
  `sSource` mediumtext NOT NULL,
  `iVersion` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Triggers `tm_solutions_strings`
--
DELIMITER $$
CREATE TRIGGER `after_insert_tm_solutions_strings` AFTER INSERT ON `tm_solutions_strings` FOR EACH ROW BEGIN INSERT INTO `history_tm_solutions_strings` (`ID`,`iVersion`,`idSolution`,`sLanguage`,`sTranslator`,`sSource`) VALUES (NEW.`ID`,@curVersion,NEW.`idSolution`,NEW.`sLanguage`,NEW.`sTranslator`,NEW.`sSource`); END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_delete_tm_solutions_strings` BEFORE DELETE ON `tm_solutions_strings` FOR EACH ROW BEGIN SELECT (UNIX_TIMESTAMP() * 10) INTO @curVersion; UPDATE `history_tm_solutions_strings` SET `iNextVersion` = @curVersion WHERE `ID` = OLD.`ID` AND `iNextVersion` IS NULL; INSERT INTO `history_tm_solutions_strings` (`ID`,`iVersion`,`idSolution`,`sLanguage`,`sTranslator`,`sSource`, `bDeleted`) VALUES (OLD.`ID`,@curVersion,OLD.`idSolution`,OLD.`sLanguage`,OLD.`sTranslator`,OLD.`sSource`, 1); END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_insert_tm_solutions_strings` BEFORE INSERT ON `tm_solutions_strings` FOR EACH ROW BEGIN IF (NEW.ID IS NULL OR NEW.ID = 0) THEN SET NEW.ID = FLOOR(RAND() * 1000000000) + FLOOR(RAND() * 1000000000) * 1000000000; END IF ; SELECT (UNIX_TIMESTAMP() * 10) INTO @curVersion;SET NEW.iVersion = @curVersion; END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_update_tm_solutions_strings` BEFORE UPDATE ON `tm_solutions_strings` FOR EACH ROW BEGIN IF NEW.iVersion <> OLD.iVersion THEN SET @curVersion = NEW.iVersion; ELSE SELECT (UNIX_TIMESTAMP() * 10) INTO @curVersion; END IF; IF NOT (OLD.`ID` = NEW.`ID` AND OLD.`idSolution` <=> NEW.`idSolution` AND OLD.`sLanguage` <=> NEW.`sLanguage` AND OLD.`sTranslator` <=> NEW.`sTranslator` AND OLD.`sSource` <=> NEW.`sSource`) THEN   SET NEW.iVersion = @curVersion;   UPDATE `history_tm_solutions_strings` SET `iNextVersion` = @curVersion WHERE `ID` = OLD.`ID` AND `iNextVersion` IS NULL;   INSERT INTO `history_tm_solutions_strings` (`ID`,`iVersion`,`idSolution`,`sLanguage`,`sTranslator`,`sSource`)       VALUES (NEW.`ID`,@curVersion,NEW.`idSolution`,NEW.`sLanguage`,NEW.`sTranslator`,NEW.`sSource`) ; END IF; END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `tm_source_codes`
--

CREATE TABLE `tm_source_codes` (
  `ID` bigint NOT NULL,
  `idUser` bigint NOT NULL,
  `idPlatform` bigint NOT NULL,
  `idTask` bigint NOT NULL,
  `sDate` datetime NOT NULL,
  `sParams` tinytext,
  `sName` varchar(250) NOT NULL,
  `sSource` text NOT NULL,
  `bEditable` tinyint(1) NOT NULL,
  `bSubmission` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'corresponds to a submission, not fetched by editor',
  `sType` enum('User','Submission','Task','Solution','Hint') NOT NULL DEFAULT 'User',
  `bActive` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'is active tab',
  `iRank` tinyint NOT NULL DEFAULT '0' COMMENT 'rank in editor tabs',
  `iVersion` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Triggers `tm_source_codes`
--
DELIMITER $$
CREATE TRIGGER `after_insert_tm_source_codes` AFTER INSERT ON `tm_source_codes` FOR EACH ROW BEGIN INSERT INTO `history_tm_source_codes` (`ID`,`iVersion`,`idUser`,`idTask`,`idPlatform`,`sDate`,`sParams`,`sName`,`sSource`,`bEditable`,`sType`,`bActive`,`bSubmission`,`iRank`) VALUES (NEW.`ID`,@curVersion,NEW.`idUser`,NEW.`idTask`,NEW.`idPlatform`,NEW.`sDate`,NEW.`sParams`,NEW.`sName`,NEW.`sSource`,NEW.`bEditable`,NEW.`sType`,NEW.`bActive`,NEW.`bSubmission`,NEW.`iRank`); END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_delete_tm_source_codes` BEFORE DELETE ON `tm_source_codes` FOR EACH ROW BEGIN SELECT (UNIX_TIMESTAMP() * 10) INTO @curVersion; UPDATE `history_tm_source_codes` SET `iNextVersion` = @curVersion WHERE `ID` = OLD.`ID` AND `iNextVersion` IS NULL; INSERT INTO `history_tm_source_codes` (`ID`,`iVersion`,`idUser`,`idTask`,`idPlatform`,`sDate`,`sParams`,`sName`,`sSource`,`bEditable`,`sType`,`bActive`,`bSubmission`,`iRank`, `bDeleted`) VALUES (OLD.`ID`,@curVersion,OLD.`idUser`,OLD.`idTask`,OLD.`idPlatform`,OLD.`sDate`,OLD.`sParams`,OLD.`sName`,OLD.`sSource`,OLD.`bEditable`,OLD.`sType`,OLD.`bActive`,OLD.`bSubmission`,OLD.`iRank`, 1); END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_insert_tm_source_codes` BEFORE INSERT ON `tm_source_codes` FOR EACH ROW BEGIN IF (NEW.ID IS NULL OR NEW.ID = 0) THEN SET NEW.ID = FLOOR(RAND() * 1000000000) + FLOOR(RAND() * 1000000000) * 1000000000; END IF ; SELECT (UNIX_TIMESTAMP() * 10) INTO @curVersion;SET NEW.iVersion = @curVersion; END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_update_tm_source_codes` BEFORE UPDATE ON `tm_source_codes` FOR EACH ROW BEGIN IF NEW.iVersion <> OLD.iVersion THEN SET @curVersion = NEW.iVersion; ELSE SELECT (UNIX_TIMESTAMP() * 10) INTO @curVersion; END IF; IF NOT (OLD.`ID` = NEW.`ID` AND OLD.`idUser` <=> NEW.`idUser` AND OLD.`idTask` <=> NEW.`idTask` AND OLD.`idPlatform` <=> NEW.`idPlatform` AND OLD.`sDate` <=> NEW.`sDate` AND OLD.`sParams` <=> NEW.`sParams` AND OLD.`sName` <=> NEW.`sName` AND OLD.`sSource` <=> NEW.`sSource` AND OLD.`bEditable` <=> NEW.`bEditable` AND OLD.`sType` <=> NEW.`sType` AND OLD.`bSubmission` <=> NEW.`bSubmission` AND OLD.`iRank` <=> NEW.`iRank`) THEN   SET NEW.iVersion = @curVersion;   UPDATE `history_tm_source_codes` SET `iNextVersion` = @curVersion WHERE `ID` = OLD.`ID` AND `iNextVersion` IS NULL;   INSERT INTO `history_tm_source_codes` (`ID`,`iVersion`,`idUser`,`idTask`,`idPlatform`,`sDate`,`sParams`,`sName`,`sSource`,`bEditable`,`sType`,`bActive`,`bSubmission`,`iRank`)       VALUES (NEW.`ID`,@curVersion,NEW.`idUser`,NEW.`idTask`,NEW.`idPlatform`,NEW.`sDate`,NEW.`sParams`,NEW.`sName`,NEW.`sSource`,NEW.`bEditable`,NEW.`sType`,NEW.`bActive`,NEW.`bSubmission`,NEW.`iRank`) ; END IF; END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `tm_submissions`
--

CREATE TABLE `tm_submissions` (
  `ID` bigint NOT NULL,
  `idUser` bigint NOT NULL,
  `idPlatform` bigint NOT NULL,
  `idTask` bigint NOT NULL COMMENT 'Problem''s ID',
  `sDate` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `idSourceCode` bigint NOT NULL,
  `bManualCorrection` tinyint NOT NULL DEFAULT '0',
  `bSuccess` tinyint NOT NULL DEFAULT '0',
  `nbTestsTotal` int NOT NULL DEFAULT '0',
  `nbTestsPassed` int NOT NULL DEFAULT '0',
  `iScore` int NOT NULL DEFAULT '0',
  `bCompilError` tinyint NOT NULL DEFAULT '0',
  `sCompilMsg` mediumtext,
  `sErrorMsg` mediumtext,
  `sFirstUserOutput` mediumtext,
  `sFirstExpectedOutput` mediumtext,
  `sManualScoreDiffComment` varchar(255) DEFAULT NULL,
  `bEvaluated` tinyint NOT NULL DEFAULT '0',
  `bConfirmed` tinyint NOT NULL DEFAULT '0' COMMENT '0 when saved for getAnswer, 1 once the grade process starts',
  `sMode` enum('Submitted','LimitedTime','Contest','UserTest') NOT NULL DEFAULT 'Submitted',
  `sReturnUrl` varchar(255) DEFAULT NULL,
  `idUserAnswer` varchar(50) DEFAULT NULL,
  `iChecksum` int NOT NULL DEFAULT '0',
  `iVersion` int NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Triggers `tm_submissions`
--
DELIMITER $$
CREATE TRIGGER `after_insert_tm_submissions` AFTER INSERT ON `tm_submissions` FOR EACH ROW BEGIN INSERT INTO `history_tm_submissions` (`ID`,`iVersion`,`idUser`,`idTask`,`idPlatform`,`sDate`,`idSourceCode`,`bManualCorrection`,`bSuccess`,`nbTestsTotal`,`nbTestsPassed`,`iScore`,`bCompilError`,`sCompilMsg`,`sErrorMsg`,`sFirstUserOutput`,`sFirstExpectedOutput`,`sManualScoreDiffComment`,`bEvaluated`,`sMode`,`sReturnUrl`,`idUserAnswer`,`iChecksum`) VALUES (NEW.`ID`,@curVersion,NEW.`idUser`,NEW.`idTask`,NEW.`idPlatform`,NEW.`sDate`,NEW.`idSourceCode`,NEW.`bManualCorrection`,NEW.`bSuccess`,NEW.`nbTestsTotal`,NEW.`nbTestsPassed`,NEW.`iScore`,NEW.`bCompilError`,NEW.`sCompilMsg`,NEW.`sErrorMsg`,NEW.`sFirstUserOutput`,NEW.`sFirstExpectedOutput`,NEW.`sManualScoreDiffComment`,NEW.`bEvaluated`,NEW.`sMode`,NEW.`sReturnUrl`,NEW.`idUserAnswer`,NEW.`iChecksum`); END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_delete_tm_submissions` BEFORE DELETE ON `tm_submissions` FOR EACH ROW BEGIN SELECT (UNIX_TIMESTAMP() * 10) INTO @curVersion; UPDATE `history_tm_submissions` SET `iNextVersion` = @curVersion WHERE `ID` = OLD.`ID` AND `iNextVersion` IS NULL; INSERT INTO `history_tm_submissions` (`ID`,`iVersion`,`idUser`,`idTask`,`idPlatform`,`sDate`,`idSourceCode`,`bManualCorrection`,`bSuccess`,`nbTestsTotal`,`nbTestsPassed`,`iScore`,`bCompilError`,`sCompilMsg`,`sErrorMsg`,`sFirstUserOutput`,`sFirstExpectedOutput`,`sManualScoreDiffComment`,`bEvaluated`,`sMode`,`sReturnUrl`,`idUserAnswer`,`iChecksum`, `bDeleted`) VALUES (OLD.`ID`,@curVersion,OLD.`idUser`,OLD.`idTask`,OLD.`idPlatform`,OLD.`sDate`,OLD.`idSourceCode`,OLD.`bManualCorrection`,OLD.`bSuccess`,OLD.`nbTestsTotal`,OLD.`nbTestsPassed`,OLD.`iScore`,OLD.`bCompilError`,OLD.`sCompilMsg`,OLD.`sErrorMsg`,OLD.`sFirstUserOutput`,OLD.`sFirstExpectedOutput`,OLD.`sManualScoreDiffComment`,OLD.`bEvaluated`,OLD.`sMode`,OLD.`sReturnUrl`,OLD.`idUserAnswer`,OLD.`iChecksum`, 1); END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_insert_tm_submissions` BEFORE INSERT ON `tm_submissions` FOR EACH ROW BEGIN IF (NEW.ID IS NULL OR NEW.ID = 0) THEN SET NEW.ID = FLOOR(RAND() * 1000000000) + FLOOR(RAND() * 1000000000) * 1000000000; END IF ; SELECT (UNIX_TIMESTAMP() * 10) INTO @curVersion;SET NEW.iVersion = @curVersion; END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_update_tm_submissions` BEFORE UPDATE ON `tm_submissions` FOR EACH ROW BEGIN IF NEW.iVersion <> OLD.iVersion THEN SET @curVersion = NEW.iVersion; ELSE SELECT (UNIX_TIMESTAMP() * 10) INTO @curVersion; END IF; IF NOT (OLD.`ID` = NEW.`ID` AND OLD.`idUser` <=> NEW.`idUser` AND OLD.`idTask` <=> NEW.`idTask` AND OLD.`idPlatform` <=> NEW.`idPlatform` AND OLD.`sDate` <=> NEW.`sDate` AND OLD.`idSourceCode` <=> NEW.`idSourceCode` AND OLD.`bManualCorrection` <=> NEW.`bManualCorrection` AND OLD.`bSuccess` <=> NEW.`bSuccess` AND OLD.`nbTestsTotal` <=> NEW.`nbTestsTotal` AND OLD.`nbTestsPassed` <=> NEW.`nbTestsPassed` AND OLD.`iScore` <=> NEW.`iScore` AND OLD.`bCompilError` <=> NEW.`bCompilError` AND OLD.`sCompilMsg` <=> NEW.`sCompilMsg` AND OLD.`sErrorMsg` <=> NEW.`sErrorMsg` AND OLD.`sFirstUserOutput` <=> NEW.`sFirstUserOutput` AND OLD.`sFirstExpectedOutput` <=> NEW.`sFirstExpectedOutput` AND OLD.`sManualScoreDiffComment` <=> NEW.`sManualScoreDiffComment` AND OLD.`bEvaluated` <=> NEW.`bEvaluated` AND OLD.`sMode` <=> NEW.`sMode` AND OLD.`sReturnUrl` <=> NEW.`sReturnUrl` AND OLD.`idUserAnswer` <=> NEW.`idUserAnswer` AND OLD.`iChecksum` <=> NEW.`iChecksum`) THEN   SET NEW.iVersion = @curVersion;   UPDATE `history_tm_submissions` SET `iNextVersion` = @curVersion WHERE `ID` = OLD.`ID` AND `iNextVersion` IS NULL;   INSERT INTO `history_tm_submissions` (`ID`,`iVersion`,`idUser`,`idTask`,`idPlatform`,`sDate`,`idSourceCode`,`bManualCorrection`,`bSuccess`,`nbTestsTotal`,`nbTestsPassed`,`iScore`,`bCompilError`,`sCompilMsg`,`sErrorMsg`,`sFirstUserOutput`,`sFirstExpectedOutput`,`sManualScoreDiffComment`,`bEvaluated`,`sMode`,`sReturnUrl`,`idUserAnswer`,`iChecksum`)       VALUES (NEW.`ID`,@curVersion,NEW.`idUser`,NEW.`idTask`,NEW.`idPlatform`,NEW.`sDate`,NEW.`idSourceCode`,NEW.`bManualCorrection`,NEW.`bSuccess`,NEW.`nbTestsTotal`,NEW.`nbTestsPassed`,NEW.`iScore`,NEW.`bCompilError`,NEW.`sCompilMsg`,NEW.`sErrorMsg`,NEW.`sFirstUserOutput`,NEW.`sFirstExpectedOutput`,NEW.`sManualScoreDiffComment`,NEW.`bEvaluated`,NEW.`sMode`,NEW.`sReturnUrl`,NEW.`idUserAnswer`,NEW.`iChecksum`) ; END IF; END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `tm_submissions_subtasks`
--

CREATE TABLE `tm_submissions_subtasks` (
  `ID` bigint NOT NULL,
  `bSuccess` tinyint(1) NOT NULL,
  `iScore` tinyint NOT NULL,
  `idSubtask` bigint NOT NULL,
  `idSubmission` bigint NOT NULL,
  `iVersion` bigint NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Triggers `tm_submissions_subtasks`
--
DELIMITER $$
CREATE TRIGGER `after_insert_tm_submissions_subtasks` AFTER INSERT ON `tm_submissions_subtasks` FOR EACH ROW BEGIN INSERT INTO `history_tm_submissions_subtasks` (`ID`,`iVersion`,`bSuccess`,`iScore`,`idSubtask`,`idSubmission`) VALUES (NEW.`ID`,@curVersion,NEW.`bSuccess`,NEW.`iScore`,NEW.`idSubtask`,NEW.`idSubmission`); END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_delete_tm_submissions_subtasks` BEFORE DELETE ON `tm_submissions_subtasks` FOR EACH ROW BEGIN SELECT (UNIX_TIMESTAMP() * 10) INTO @curVersion; UPDATE `history_tm_submissions_subtasks` SET `iNextVersion` = @curVersion WHERE `ID` = OLD.`ID` AND `iNextVersion` IS NULL; INSERT INTO `history_tm_submissions_subtasks` (`ID`,`iVersion`,`bSuccess`,`iScore`,`idSubtask`,`idSubmission`, `bDeleted`) VALUES (OLD.`ID`,@curVersion,OLD.`bSuccess`,OLD.`iScore`,OLD.`idSubtask`,OLD.`idSubmission`, 1); END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_insert_tm_submissions_subtasks` BEFORE INSERT ON `tm_submissions_subtasks` FOR EACH ROW BEGIN IF (NEW.ID IS NULL OR NEW.ID = 0) THEN SET NEW.ID = FLOOR(RAND() * 1000000000) + FLOOR(RAND() * 1000000000) * 1000000000; END IF ; SELECT (UNIX_TIMESTAMP() * 10) INTO @curVersion;SET NEW.iVersion = @curVersion; END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_update_tm_submissions_subtasks` BEFORE UPDATE ON `tm_submissions_subtasks` FOR EACH ROW BEGIN IF NEW.iVersion <> OLD.iVersion THEN SET @curVersion = NEW.iVersion; ELSE SELECT (UNIX_TIMESTAMP() * 10) INTO @curVersion; END IF; IF NOT (OLD.`ID` = NEW.`ID` AND OLD.`bSuccess` <=> NEW.`bSuccess` AND OLD.`iScore` <=> NEW.`iScore` AND OLD.`idSubtask` <=> NEW.`idSubtask` AND OLD.`idSubmission` <=> NEW.`idSubmission`) THEN   SET NEW.iVersion = @curVersion;   UPDATE `history_tm_submissions_subtasks` SET `iNextVersion` = @curVersion WHERE `ID` = OLD.`ID` AND `iNextVersion` IS NULL;   INSERT INTO `history_tm_submissions_subtasks` (`ID`,`iVersion`,`bSuccess`,`iScore`,`idSubtask`,`idSubmission`)       VALUES (NEW.`ID`,@curVersion,NEW.`bSuccess`,NEW.`iScore`,NEW.`idSubtask`,NEW.`idSubmission`) ; END IF; END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `tm_submissions_tests`
--

CREATE TABLE `tm_submissions_tests` (
  `ID` bigint NOT NULL,
  `idSubmission` bigint NOT NULL DEFAULT '0',
  `idTest` bigint NOT NULL DEFAULT '0',
  `iScore` tinyint NOT NULL DEFAULT '0',
  `iTimeMs` int NOT NULL DEFAULT '0',
  `iMemoryKb` int NOT NULL DEFAULT '0',
  `iErrorCode` int NOT NULL DEFAULT '0',
  `sOutput` mediumtext,
  `sExpectedOutput` mediumtext,
  `sErrorMsg` mediumtext,
  `sLog` mediumtext,
  `bNoFeedback` tinyint(1) NOT NULL DEFAULT '0',
  `jFiles` mediumtext,
  `iVersion` int NOT NULL,
  `idSubmissionSubtask` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Triggers `tm_submissions_tests`
--
DELIMITER $$
CREATE TRIGGER `after_insert_tm_submissions_tests` AFTER INSERT ON `tm_submissions_tests` FOR EACH ROW BEGIN INSERT INTO `history_tm_submissions_tests` (`ID`,`iVersion`,`idSubmission`,`idTest`,`iScore`,`iTimeMs`,`iMemoryKb`,`iErrorCode`,`sOutput`,`sExpectedOutput`,`sLog`,`bNoFeedback`,`jFiles`,`sErrorMsg`,`idSubmissionSubtask`) VALUES (NEW.`ID`,@curVersion,NEW.`idSubmission`,NEW.`idTest`,NEW.`iScore`,NEW.`iTimeMs`,NEW.`iMemoryKb`,NEW.`iErrorCode`,NEW.`sOutput`,NEW.`sExpectedOutput`,NEW.`sLog`,NEW.`bNoFeedback`,NEW.`jFiles`,NEW.`sErrorMsg`,NEW.`idSubmissionSubtask`); END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_delete_tm_submissions_tests` BEFORE DELETE ON `tm_submissions_tests` FOR EACH ROW BEGIN SELECT (UNIX_TIMESTAMP() * 10) INTO @curVersion; UPDATE `history_tm_submissions_tests` SET `iNextVersion` = @curVersion WHERE `ID` = OLD.`ID` AND `iNextVersion` IS NULL; INSERT INTO `history_tm_submissions_tests` (`ID`,`iVersion`,`idSubmission`,`idTest`,`iScore`,`iTimeMs`,`iMemoryKb`,`iErrorCode`,`sOutput`,`sExpectedOutput`,`sLog`,`bNoFeedback`,`jFiles`,`sErrorMsg`,`idSubmissionSubtask`, `bDeleted`) VALUES (OLD.`ID`,@curVersion,OLD.`idSubmission`,OLD.`idTest`,OLD.`iScore`,OLD.`iTimeMs`,OLD.`iMemoryKb`,OLD.`iErrorCode`,OLD.`sOutput`,OLD.`sExpectedOutput`,OLD.`sLog`,OLD.`bNoFeedback`,OLD.`jFiles`,OLD.`sErrorMsg`,OLD.`idSubmissionSubtask`, 1); END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_insert_tm_submissions_tests` BEFORE INSERT ON `tm_submissions_tests` FOR EACH ROW BEGIN IF (NEW.ID IS NULL OR NEW.ID = 0) THEN SET NEW.ID = FLOOR(RAND() * 1000000000) + FLOOR(RAND() * 1000000000) * 1000000000; END IF ; SELECT (UNIX_TIMESTAMP() * 10) INTO @curVersion;SET NEW.iVersion = @curVersion; END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_update_tm_submissions_tests` BEFORE UPDATE ON `tm_submissions_tests` FOR EACH ROW BEGIN IF NEW.iVersion <> OLD.iVersion THEN SET @curVersion = NEW.iVersion; ELSE SELECT (UNIX_TIMESTAMP() * 10) INTO @curVersion; END IF; IF NOT (OLD.`ID` = NEW.`ID` AND OLD.`idSubmission` <=> NEW.`idSubmission` AND OLD.`idTest` <=> NEW.`idTest` AND OLD.`iScore` <=> NEW.`iScore` AND OLD.`iTimeMs` <=> NEW.`iTimeMs` AND OLD.`iMemoryKb` <=> NEW.`iMemoryKb` AND OLD.`iErrorCode` <=> NEW.`iErrorCode` AND OLD.`sOutput` <=> NEW.`sOutput` AND OLD.`sExpectedOutput` <=> NEW.`sExpectedOutput` AND OLD.`sLog` <=> NEW.`sLog` AND OLD.`bNoFeedback` <=> NEW.`bNoFeedback` AND OLD.`jFiles` <=> NEW.`jFiles` AND OLD.`sErrorMsg` <=> NEW.`sErrorMsg` AND OLD.`idSubmissionSubtask` <=> NEW.`idSubmissionSubtask`) THEN   SET NEW.iVersion = @curVersion;   UPDATE `history_tm_submissions_tests` SET `iNextVersion` = @curVersion WHERE `ID` = OLD.`ID` AND `iNextVersion` IS NULL;   INSERT INTO `history_tm_submissions_tests` (`ID`,`iVersion`,`idSubmission`,`idTest`,`iScore`,`iTimeMs`,`iMemoryKb`,`iErrorCode`,`sOutput`,`sExpectedOutput`,`sLog`,`bNoFeedback`,`jFiles`,`sErrorMsg`,`idSubmissionSubtask`)       VALUES (NEW.`ID`,@curVersion,NEW.`idSubmission`,NEW.`idTest`,NEW.`iScore`,NEW.`iTimeMs`,NEW.`iMemoryKb`,NEW.`iErrorCode`,NEW.`sOutput`,NEW.`sExpectedOutput`,NEW.`sLog`,NEW.`bNoFeedback`,NEW.`jFiles`,NEW.`sErrorMsg`,NEW.`idSubmissionSubtask`) ; END IF; END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `tm_tasks`
--

CREATE TABLE `tm_tasks` (
  `ID` bigint NOT NULL,
  `sTextId` varchar(100) NOT NULL,
  `sSupportedLangProg` varchar(255) NOT NULL DEFAULT '*',
  `sEvalTags` varchar(255) NOT NULL DEFAULT '',
  `sAuthor` varchar(100) NOT NULL,
  `sAuthorSolution` varchar(100) NOT NULL,
  `bShowLimits` tinyint(1) NOT NULL DEFAULT '1',
  `bEditorInStatement` tinyint(1) NOT NULL DEFAULT '0',
  `bUserTests` tinyint(1) NOT NULL DEFAULT '1',
  `bChecked` tinyint(1) NOT NULL DEFAULT '0',
  `iEvalMode` tinyint(1) NOT NULL DEFAULT '0',
  `bUsesLibrary` tinyint(1) NOT NULL,
  `bUseLatex` tinyint(1) NOT NULL DEFAULT '0',
  `iTestsMinSuccessScore` tinyint NOT NULL DEFAULT '100',
  `bIsEvaluable` tinyint(1) NOT NULL DEFAULT '1',
  `sTemplateName` varchar(100) NOT NULL DEFAULT '',
  `sScriptAnimation` text,
  `sDefaultEditorMode` enum('simple','normal','expert','') NOT NULL DEFAULT 'normal',
  `sEvalResultOutputScript` varchar(50) DEFAULT NULL,
  `bTestMode` tinyint(1) NOT NULL DEFAULT '0',
  `sTaskPath` varchar(100) NOT NULL COMMENT 'taskPath as documented in taskgrader',
  `sRevision` varchar(100) DEFAULT NULL,
  `sAssetsBaseUrl` varchar(250) DEFAULT NULL,
  `iVersion` bigint NOT NULL DEFAULT '0',
  `bHasSubtasks` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Triggers `tm_tasks`
--
DELIMITER $$
CREATE TRIGGER `after_insert_tm_tasks` AFTER INSERT ON `tm_tasks` FOR EACH ROW BEGIN INSERT INTO `history_tm_tasks` (`ID`,`iVersion`,`sScriptAnimation`,`sTextId`,`sSupportedLangProg`,`sEvalTags`,`bShowLimits`,`bEditorInStatement`,`bUserTests`,`bUseLatex`,`iTestsMinSuccessScore`,`bIsEvaluable`,`sEvalResultOutputScript`,`sTaskPath`,`sRevision`,`sAssetsBaseUrl`,`sDefaultEditorMode`,`bTestMode`,`bHasSubtasks`) VALUES (NEW.`ID`,@curVersion,NEW.`sScriptAnimation`,NEW.`sTextId`,NEW.`sSupportedLangProg`,NEW.`sEvalTags`,NEW.`bShowLimits`,NEW.`bEditorInStatement`,NEW.`bUserTests`,NEW.`bUseLatex`,NEW.`iTestsMinSuccessScore`,NEW.`bIsEvaluable`,NEW.`sEvalResultOutputScript`,NEW.`sTaskPath`,NEW.`sRevision`,NEW.`sAssetsBaseUrl`,NEW.`sDefaultEditorMode`,NEW.`bTestMode`,NEW.`bHasSubtasks`); END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_delete_tm_tasks` BEFORE DELETE ON `tm_tasks` FOR EACH ROW BEGIN SELECT (UNIX_TIMESTAMP() * 10) INTO @curVersion; UPDATE `history_tm_tasks` SET `iNextVersion` = @curVersion WHERE `ID` = OLD.`ID` AND `iNextVersion` IS NULL; INSERT INTO `history_tm_tasks` (`ID`,`iVersion`,`sScriptAnimation`,`sTextId`,`sSupportedLangProg`,`sEvalTags`,`bShowLimits`,`bEditorInStatement`,`bUserTests`,`bUseLatex`,`iTestsMinSuccessScore`,`bIsEvaluable`,`sEvalResultOutputScript`,`sTaskPath`,`sRevision`,`sAssetsBaseUrl`,`sDefaultEditorMode`,`bTestMode`,`bHasSubtasks`, `bDeleted`) VALUES (OLD.`ID`,@curVersion,OLD.`sScriptAnimation`,OLD.`sTextId`,OLD.`sSupportedLangProg`,OLD.`sEvalTags`,OLD.`bShowLimits`,OLD.`bEditorInStatement`,OLD.`bUserTests`,OLD.`bUseLatex`,OLD.`iTestsMinSuccessScore`,OLD.`bIsEvaluable`,OLD.`sEvalResultOutputScript`,OLD.`sTaskPath`,OLD.`sRevision`,OLD.`sAssetsBaseUrl`,OLD.`sDefaultEditorMode`,OLD.`bTestMode`,OLD.`bHasSubtasks`, 1); END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_insert_tm_tasks` BEFORE INSERT ON `tm_tasks` FOR EACH ROW BEGIN IF (NEW.ID IS NULL OR NEW.ID = 0) THEN SET NEW.ID = FLOOR(RAND() * 1000000000) + FLOOR(RAND() * 1000000000) * 1000000000; END IF ; SELECT (UNIX_TIMESTAMP() * 10) INTO @curVersion;SET NEW.iVersion = @curVersion; END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_update_tm_tasks` BEFORE UPDATE ON `tm_tasks` FOR EACH ROW BEGIN IF NEW.iVersion <> OLD.iVersion THEN SET @curVersion = NEW.iVersion; ELSE SELECT (UNIX_TIMESTAMP() * 10) INTO @curVersion; END IF; IF NOT (OLD.`ID` = NEW.`ID` AND OLD.`sScriptAnimation` <=> NEW.`sScriptAnimation` AND OLD.`sTextId` <=> NEW.`sTextId` AND OLD.`sSupportedLangProg` <=> NEW.`sSupportedLangProg` AND OLD.`sEvalTags` <=> NEW.`sEvalTags` AND OLD.`bShowLimits` <=> NEW.`bShowLimits` AND OLD.`bEditorInStatement` <=> NEW.`bEditorInStatement` AND OLD.`bUserTests` <=> NEW.`bUserTests` AND OLD.`bUseLatex` <=> NEW.`bUseLatex` AND OLD.`iTestsMinSuccessScore` <=> NEW.`iTestsMinSuccessScore` AND OLD.`bIsEvaluable` <=> NEW.`bIsEvaluable` AND OLD.`sEvalResultOutputScript` <=> NEW.`sEvalResultOutputScript` AND OLD.`sTaskPath` <=> NEW.`sTaskPath` AND OLD.`sRevision` <=> NEW.`sRevision` AND OLD.`sAssetsBaseUrl` <=> NEW.`sAssetsBaseUrl` AND OLD.`sDefaultEditorMode` <=> NEW.`sDefaultEditorMode` AND OLD.`bTestMode` <=> NEW.`bTestMode` AND OLD.`bHasSubtasks` <=> NEW.`bHasSubtasks`) THEN   SET NEW.iVersion = @curVersion;   UPDATE `history_tm_tasks` SET `iNextVersion` = @curVersion WHERE `ID` = OLD.`ID` AND `iNextVersion` IS NULL;   INSERT INTO `history_tm_tasks` (`ID`,`iVersion`,`sScriptAnimation`,`sTextId`,`sSupportedLangProg`,`sEvalTags`,`bShowLimits`,`bEditorInStatement`,`bUserTests`,`bUseLatex`,`iTestsMinSuccessScore`,`bIsEvaluable`,`sEvalResultOutputScript`,`sTaskPath`,`sRevision`,`sAssetsBaseUrl`,`sDefaultEditorMode`,`bTestMode`,`bHasSubtasks`)       VALUES (NEW.`ID`,@curVersion,NEW.`sScriptAnimation`,NEW.`sTextId`,NEW.`sSupportedLangProg`,NEW.`sEvalTags`,NEW.`bShowLimits`,NEW.`bEditorInStatement`,NEW.`bUserTests`,NEW.`bUseLatex`,NEW.`iTestsMinSuccessScore`,NEW.`bIsEvaluable`,NEW.`sEvalResultOutputScript`,NEW.`sTaskPath`,NEW.`sRevision`,NEW.`sAssetsBaseUrl`,NEW.`sDefaultEditorMode`,NEW.`bTestMode`,NEW.`bHasSubtasks`) ; END IF; END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `tm_tasks_limits`
--

CREATE TABLE `tm_tasks_limits` (
  `ID` bigint NOT NULL,
  `idTask` bigint NOT NULL,
  `sLangProg` varchar(255) NOT NULL DEFAULT '*',
  `iMaxTime` int NOT NULL DEFAULT '10000' COMMENT 'max allowed time in ms',
  `iMaxMemory` int NOT NULL COMMENT 'max allowed memory in kb',
  `iVersion` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Triggers `tm_tasks_limits`
--
DELIMITER $$
CREATE TRIGGER `after_insert_tm_tasks_limits` AFTER INSERT ON `tm_tasks_limits` FOR EACH ROW BEGIN INSERT INTO `history_tm_tasks_limits` (`ID`,`iVersion`,`idTask`,`sLangProg`,`iMaxTime`,`iMaxMemory`) VALUES (NEW.`ID`,@curVersion,NEW.`idTask`,NEW.`sLangProg`,NEW.`iMaxTime`,NEW.`iMaxMemory`); END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_delete_tm_tasks_limits` BEFORE DELETE ON `tm_tasks_limits` FOR EACH ROW BEGIN SELECT (UNIX_TIMESTAMP() * 10) INTO @curVersion; UPDATE `history_tm_tasks_limits` SET `iNextVersion` = @curVersion WHERE `ID` = OLD.`ID` AND `iNextVersion` IS NULL; INSERT INTO `history_tm_tasks_limits` (`ID`,`iVersion`,`idTask`,`sLangProg`,`iMaxTime`,`iMaxMemory`, `bDeleted`) VALUES (OLD.`ID`,@curVersion,OLD.`idTask`,OLD.`sLangProg`,OLD.`iMaxTime`,OLD.`iMaxMemory`, 1); END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_insert_tm_tasks_limits` BEFORE INSERT ON `tm_tasks_limits` FOR EACH ROW BEGIN IF (NEW.ID IS NULL OR NEW.ID = 0) THEN SET NEW.ID = FLOOR(RAND() * 1000000000) + FLOOR(RAND() * 1000000000) * 1000000000; END IF ; SELECT (UNIX_TIMESTAMP() * 10) INTO @curVersion;SET NEW.iVersion = @curVersion; END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_update_tm_tasks_limits` BEFORE UPDATE ON `tm_tasks_limits` FOR EACH ROW BEGIN IF NEW.iVersion <> OLD.iVersion THEN SET @curVersion = NEW.iVersion; ELSE SELECT (UNIX_TIMESTAMP() * 10) INTO @curVersion; END IF; IF NOT (OLD.`ID` = NEW.`ID` AND OLD.`idTask` <=> NEW.`idTask` AND OLD.`sLangProg` <=> NEW.`sLangProg` AND OLD.`iMaxTime` <=> NEW.`iMaxTime` AND OLD.`iMaxMemory` <=> NEW.`iMaxMemory`) THEN   SET NEW.iVersion = @curVersion;   UPDATE `history_tm_tasks_limits` SET `iNextVersion` = @curVersion WHERE `ID` = OLD.`ID` AND `iNextVersion` IS NULL;   INSERT INTO `history_tm_tasks_limits` (`ID`,`iVersion`,`idTask`,`sLangProg`,`iMaxTime`,`iMaxMemory`)       VALUES (NEW.`ID`,@curVersion,NEW.`idTask`,NEW.`sLangProg`,NEW.`iMaxTime`,NEW.`iMaxMemory`) ; END IF; END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `tm_tasks_strings`
--

CREATE TABLE `tm_tasks_strings` (
  `ID` bigint NOT NULL,
  `idTask` bigint NOT NULL,
  `sLanguage` varchar(5) NOT NULL,
  `sTitle` varchar(100) NOT NULL COMMENT 'title of the task',
  `sTranslator` varchar(100) NOT NULL,
  `sStatement` mediumtext NOT NULL,
  `sSolution` mediumtext,
  `iVersion` int NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Triggers `tm_tasks_strings`
--
DELIMITER $$
CREATE TRIGGER `after_insert_tm_tasks_strings` AFTER INSERT ON `tm_tasks_strings` FOR EACH ROW BEGIN INSERT INTO `history_tm_tasks_strings` (`ID`,`iVersion`,`idTask`,`sLanguage`,`sTitle`,`sTranslator`,`sStatement`,`sSolution`) VALUES (NEW.`ID`,@curVersion,NEW.`idTask`,NEW.`sLanguage`,NEW.`sTitle`,NEW.`sTranslator`,NEW.`sStatement`,NEW.`sSolution`); END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_delete_tm_tasks_strings` BEFORE DELETE ON `tm_tasks_strings` FOR EACH ROW BEGIN SELECT (UNIX_TIMESTAMP() * 10) INTO @curVersion; UPDATE `history_tm_tasks_strings` SET `iNextVersion` = @curVersion WHERE `ID` = OLD.`ID` AND `iNextVersion` IS NULL; INSERT INTO `history_tm_tasks_strings` (`ID`,`iVersion`,`idTask`,`sLanguage`,`sTitle`,`sTranslator`,`sStatement`,`sSolution`, `bDeleted`) VALUES (OLD.`ID`,@curVersion,OLD.`idTask`,OLD.`sLanguage`,OLD.`sTitle`,OLD.`sTranslator`,OLD.`sStatement`,OLD.`sSolution`, 1); END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_insert_tm_tasks_strings` BEFORE INSERT ON `tm_tasks_strings` FOR EACH ROW BEGIN IF (NEW.ID IS NULL OR NEW.ID = 0) THEN SET NEW.ID = FLOOR(RAND() * 1000000000) + FLOOR(RAND() * 1000000000) * 1000000000; END IF ; SELECT (UNIX_TIMESTAMP() * 10) INTO @curVersion;SET NEW.iVersion = @curVersion; END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_update_tm_tasks_strings` BEFORE UPDATE ON `tm_tasks_strings` FOR EACH ROW BEGIN IF NEW.iVersion <> OLD.iVersion THEN SET @curVersion = NEW.iVersion; ELSE SELECT (UNIX_TIMESTAMP() * 10) INTO @curVersion; END IF; IF NOT (OLD.`ID` = NEW.`ID` AND OLD.`idTask` <=> NEW.`idTask` AND OLD.`sLanguage` <=> NEW.`sLanguage` AND OLD.`sTitle` <=> NEW.`sTitle` AND OLD.`sTranslator` <=> NEW.`sTranslator` AND OLD.`sStatement` <=> NEW.`sStatement` AND OLD.`sSolution` <=> NEW.`sSolution`) THEN   SET NEW.iVersion = @curVersion;   UPDATE `history_tm_tasks_strings` SET `iNextVersion` = @curVersion WHERE `ID` = OLD.`ID` AND `iNextVersion` IS NULL;   INSERT INTO `history_tm_tasks_strings` (`ID`,`iVersion`,`idTask`,`sLanguage`,`sTitle`,`sTranslator`,`sStatement`,`sSolution`)       VALUES (NEW.`ID`,@curVersion,NEW.`idTask`,NEW.`sLanguage`,NEW.`sTitle`,NEW.`sTranslator`,NEW.`sStatement`,NEW.`sSolution`) ; END IF; END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `tm_tasks_subtasks`
--

CREATE TABLE `tm_tasks_subtasks` (
  `ID` bigint NOT NULL,
  `idTask` bigint NOT NULL,
  `iRank` tinyint NOT NULL COMMENT 'position of the subtask in the task',
  `name` varchar(255) NOT NULL,
  `comments` text NOT NULL,
  `iPointsMax` tinyint NOT NULL,
  `bActive` tinyint(1) NOT NULL DEFAULT '1',
  `iVersion` bigint NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Triggers `tm_tasks_subtasks`
--
DELIMITER $$
CREATE TRIGGER `after_insert_tm_tasks_subtasks` AFTER INSERT ON `tm_tasks_subtasks` FOR EACH ROW BEGIN INSERT INTO `history_tm_tasks_subtasks` (`ID`,`iVersion`,`idTask`,`name`,`comments`,`iPointsMax`,`iRank`,`bActive`) VALUES (NEW.`ID`,@curVersion,NEW.`idTask`,NEW.`name`,NEW.`comments`,NEW.`iPointsMax`,NEW.`iRank`,NEW.`bActive`); END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_delete_tm_tasks_subtasks` BEFORE DELETE ON `tm_tasks_subtasks` FOR EACH ROW BEGIN SELECT (UNIX_TIMESTAMP() * 10) INTO @curVersion; UPDATE `history_tm_tasks_subtasks` SET `iNextVersion` = @curVersion WHERE `ID` = OLD.`ID` AND `iNextVersion` IS NULL; INSERT INTO `history_tm_tasks_subtasks` (`ID`,`iVersion`,`idTask`,`name`,`comments`,`iPointsMax`,`iRank`,`bActive`, `bDeleted`) VALUES (OLD.`ID`,@curVersion,OLD.`idTask`,OLD.`name`,OLD.`comments`,OLD.`iPointsMax`,OLD.`iRank`,OLD.`bActive`, 1); END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_insert_tm_tasks_subtasks` BEFORE INSERT ON `tm_tasks_subtasks` FOR EACH ROW BEGIN IF (NEW.ID IS NULL OR NEW.ID = 0) THEN SET NEW.ID = FLOOR(RAND() * 1000000000) + FLOOR(RAND() * 1000000000) * 1000000000; END IF ; SELECT (UNIX_TIMESTAMP() * 10) INTO @curVersion;SET NEW.iVersion = @curVersion; END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_update_tm_tasks_subtasks` BEFORE UPDATE ON `tm_tasks_subtasks` FOR EACH ROW BEGIN IF NEW.iVersion <> OLD.iVersion THEN SET @curVersion = NEW.iVersion; ELSE SELECT (UNIX_TIMESTAMP() * 10) INTO @curVersion; END IF; IF NOT (OLD.`ID` = NEW.`ID` AND OLD.`idTask` <=> NEW.`idTask` AND OLD.`name` <=> NEW.`name` AND OLD.`comments` <=> NEW.`comments` AND OLD.`iPointsMax` <=> NEW.`iPointsMax` AND OLD.`iRank` <=> NEW.`iRank` AND OLD.`bActive` <=> NEW.`bActive`) THEN   SET NEW.iVersion = @curVersion;   UPDATE `history_tm_tasks_subtasks` SET `iNextVersion` = @curVersion WHERE `ID` = OLD.`ID` AND `iNextVersion` IS NULL;   INSERT INTO `history_tm_tasks_subtasks` (`ID`,`iVersion`,`idTask`,`name`,`comments`,`iPointsMax`,`iRank`,`bActive`)       VALUES (NEW.`ID`,@curVersion,NEW.`idTask`,NEW.`name`,NEW.`comments`,NEW.`iPointsMax`,NEW.`iRank`,NEW.`bActive`) ; END IF; END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `tm_tasks_tests`
--

CREATE TABLE `tm_tasks_tests` (
  `ID` bigint NOT NULL,
  `idTask` bigint NOT NULL,
  `idSubtask` bigint DEFAULT NULL,
  `idSubmission` bigint DEFAULT NULL,
  `sGroupType` enum('Example','User','Evaluation','Submission') NOT NULL DEFAULT 'User',
  `idUser` bigint DEFAULT NULL,
  `idPlatform` bigint DEFAULT NULL,
  `iRank` tinyint NOT NULL DEFAULT '0',
  `bActive` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'current tab or not, relevant only with user tests',
  `sName` varchar(100) NOT NULL,
  `sInput` mediumtext,
  `sOutput` mediumtext,
  `iVersion` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Triggers `tm_tasks_tests`
--
DELIMITER $$
CREATE TRIGGER `after_insert_tm_tasks_tests` AFTER INSERT ON `tm_tasks_tests` FOR EACH ROW BEGIN INSERT INTO `history_tm_tasks_tests` (`ID`,`iVersion`,`idTask`,`idSubtask`,`idSubmission`,`sGroupType`,`idUser`,`idPlatform`,`sOutput`,`sInput`,`sName`,`iRank`) VALUES (NEW.`ID`,@curVersion,NEW.`idTask`,NEW.`idSubtask`,NEW.`idSubmission`,NEW.`sGroupType`,NEW.`idUser`,NEW.`idPlatform`,NEW.`sOutput`,NEW.`sInput`,NEW.`sName`,NEW.`iRank`); END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_delete_tm_tasks_tests` BEFORE DELETE ON `tm_tasks_tests` FOR EACH ROW BEGIN SELECT (UNIX_TIMESTAMP() * 10) INTO @curVersion; UPDATE `history_tm_tasks_tests` SET `iNextVersion` = @curVersion WHERE `ID` = OLD.`ID` AND `iNextVersion` IS NULL; INSERT INTO `history_tm_tasks_tests` (`ID`,`iVersion`,`idTask`,`idSubtask`,`idSubmission`,`sGroupType`,`idUser`,`idPlatform`,`sOutput`,`sInput`,`sName`,`iRank`, `bDeleted`) VALUES (OLD.`ID`,@curVersion,OLD.`idTask`,OLD.`idSubtask`,OLD.`idSubmission`,OLD.`sGroupType`,OLD.`idUser`,OLD.`idPlatform`,OLD.`sOutput`,OLD.`sInput`,OLD.`sName`,OLD.`iRank`, 1); END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_insert_tm_tasks_tests` BEFORE INSERT ON `tm_tasks_tests` FOR EACH ROW BEGIN IF (NEW.ID IS NULL OR NEW.ID = 0) THEN SET NEW.ID = FLOOR(RAND() * 1000000000) + FLOOR(RAND() * 1000000000) * 1000000000; END IF ; SELECT (UNIX_TIMESTAMP() * 10) INTO @curVersion;SET NEW.iVersion = @curVersion; END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_update_tm_tasks_tests` BEFORE UPDATE ON `tm_tasks_tests` FOR EACH ROW BEGIN IF NEW.iVersion <> OLD.iVersion THEN SET @curVersion = NEW.iVersion; ELSE SELECT (UNIX_TIMESTAMP() * 10) INTO @curVersion; END IF; IF NOT (OLD.`ID` = NEW.`ID` AND OLD.`idTask` <=> NEW.`idTask` AND OLD.`idSubtask` <=> NEW.`idSubtask` AND OLD.`idSubmission` <=> NEW.`idSubmission` AND OLD.`sGroupType` <=> NEW.`sGroupType` AND OLD.`idUser` <=> NEW.`idUser` AND OLD.`idPlatform` <=> NEW.`idPlatform` AND OLD.`sOutput` <=> NEW.`sOutput` AND OLD.`sInput` <=> NEW.`sInput` AND OLD.`sName` <=> NEW.`sName` AND OLD.`iRank` <=> NEW.`iRank`) THEN   SET NEW.iVersion = @curVersion;   UPDATE `history_tm_tasks_tests` SET `iNextVersion` = @curVersion WHERE `ID` = OLD.`ID` AND `iNextVersion` IS NULL;   INSERT INTO `history_tm_tasks_tests` (`ID`,`iVersion`,`idTask`,`idSubtask`,`idSubmission`,`sGroupType`,`idUser`,`idPlatform`,`sOutput`,`sInput`,`sName`,`iRank`)       VALUES (NEW.`ID`,@curVersion,NEW.`idTask`,NEW.`idSubtask`,NEW.`idSubmission`,NEW.`sGroupType`,NEW.`idUser`,NEW.`idPlatform`,NEW.`sOutput`,NEW.`sInput`,NEW.`sName`,NEW.`iRank`) ; END IF; END
$$
DELIMITER ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `error_log`
--
ALTER TABLE `error_log`
  ADD PRIMARY KEY (`ID`);

--
-- Indexes for table `history_test_sync_main`
--
ALTER TABLE `history_test_sync_main`
  ADD PRIMARY KEY (`historyID`),
  ADD KEY `ID` (`ID`),
  ADD KEY `iVersion` (`iVersion`);

--
-- Indexes for table `history_test_sync_second`
--
ALTER TABLE `history_test_sync_second`
  ADD PRIMARY KEY (`historyID`),
  ADD KEY `ID` (`ID`),
  ADD KEY `iVersion` (`iVersion`);

--
-- Indexes for table `history_test_sync_third`
--
ALTER TABLE `history_test_sync_third`
  ADD PRIMARY KEY (`historyID`),
  ADD KEY `ID` (`ID`),
  ADD KEY `iVersion` (`iVersion`);

--
-- Indexes for table `history_tm_hints`
--
ALTER TABLE `history_tm_hints`
  ADD PRIMARY KEY (`historyID`),
  ADD KEY `idTask` (`idTask`),
  ADD KEY `synchro` (`iVersion`),
  ADD KEY `iNextVersion` (`iNextVersion`),
  ADD KEY `bDeleted` (`bDeleted`);

--
-- Indexes for table `history_tm_hints_strings`
--
ALTER TABLE `history_tm_hints_strings`
  ADD PRIMARY KEY (`historyID`),
  ADD KEY `idHint` (`idHint`),
  ADD KEY `idHintsLanguage` (`idHint`,`sLanguage`),
  ADD KEY `synchro` (`iVersion`),
  ADD KEY `iNextVersion` (`iNextVersion`),
  ADD KEY `bDeleted` (`bDeleted`);

--
-- Indexes for table `history_tm_recordings`
--
ALTER TABLE `history_tm_recordings`
  ADD PRIMARY KEY (`historyID`),
  ADD KEY `idTask` (`idTask`),
  ADD KEY `iVersion` (`iVersion`),
  ADD KEY `iNextVersion` (`iNextVersion`),
  ADD KEY `bDeleted` (`bDeleted`);

--
-- Indexes for table `history_tm_solutions`
--
ALTER TABLE `history_tm_solutions`
  ADD PRIMARY KEY (`historyID`),
  ADD KEY `idTask` (`idTask`),
  ADD KEY `iVersion` (`iVersion`),
  ADD KEY `iNextVersion` (`iNextVersion`),
  ADD KEY `bDeleted` (`bDeleted`);

--
-- Indexes for table `history_tm_solutions_strings`
--
ALTER TABLE `history_tm_solutions_strings`
  ADD PRIMARY KEY (`historyID`),
  ADD KEY `idSolution` (`idSolution`),
  ADD KEY `idSolutionsLanguage` (`idSolution`,`sLanguage`),
  ADD KEY `iVersion` (`iVersion`),
  ADD KEY `iNextVersion` (`iNextVersion`),
  ADD KEY `bDeleted` (`bDeleted`);

--
-- Indexes for table `history_tm_source_codes`
--
ALTER TABLE `history_tm_source_codes`
  ADD PRIMARY KEY (`historyID`),
  ADD KEY `UserTask` (`idUser`,`idTask`,`idPlatform`),
  ADD KEY `idTask` (`idTask`),
  ADD KEY `recordID` (`ID`),
  ADD KEY `iVersion` (`iVersion`),
  ADD KEY `iNextVersion` (`iNextVersion`),
  ADD KEY `bDeleted` (`bDeleted`);

--
-- Indexes for table `history_tm_submissions`
--
ALTER TABLE `history_tm_submissions`
  ADD PRIMARY KEY (`historyID`),
  ADD KEY `iVersion` (`iVersion`),
  ADD KEY `iNextVersion` (`iNextVersion`),
  ADD KEY `bDeleted` (`bDeleted`),
  ADD KEY `checksum` (`iChecksum`),
  ADD KEY `date` (`sDate`),
  ADD KEY `user` (`idUser`,`idPlatform`),
  ADD KEY `idTask` (`idTask`),
  ADD KEY `userTask` (`idTask`,`idUser`,`idPlatform`),
  ADD KEY `idSourceCode` (`idSourceCode`);

--
-- Indexes for table `history_tm_submissions_subtasks`
--
ALTER TABLE `history_tm_submissions_subtasks`
  ADD PRIMARY KEY (`historyID`),
  ADD KEY `iVersion` (`iVersion`),
  ADD KEY `iNextVersion` (`iNextVersion`),
  ADD KEY `bDeleted` (`bDeleted`);

--
-- Indexes for table `history_tm_submissions_tests`
--
ALTER TABLE `history_tm_submissions_tests`
  ADD PRIMARY KEY (`historyID`),
  ADD KEY `iVersion` (`iVersion`),
  ADD KEY `iNextVersion` (`iNextVersion`),
  ADD KEY `bDeleted` (`bDeleted`),
  ADD KEY `idSubmission` (`idSubmission`),
  ADD KEY `idTest` (`idTest`);

--
-- Indexes for table `history_tm_tasks`
--
ALTER TABLE `history_tm_tasks`
  ADD PRIMARY KEY (`historyID`),
  ADD KEY `iVersion` (`iVersion`),
  ADD KEY `iNextVersion` (`iNextVersion`),
  ADD KEY `bDeleted` (`bDeleted`);

--
-- Indexes for table `history_tm_tasks_limits`
--
ALTER TABLE `history_tm_tasks_limits`
  ADD PRIMARY KEY (`historyID`),
  ADD KEY `idTask` (`idTask`),
  ADD KEY `iVersion` (`iVersion`),
  ADD KEY `iNextVersion` (`iNextVersion`),
  ADD KEY `bDeleted` (`bDeleted`);

--
-- Indexes for table `history_tm_tasks_strings`
--
ALTER TABLE `history_tm_tasks_strings`
  ADD PRIMARY KEY (`historyID`),
  ADD KEY `idTask` (`idTask`),
  ADD KEY `idTasksLang` (`idTask`,`sLanguage`),
  ADD KEY `iVersion` (`iVersion`),
  ADD KEY `iNextVersion` (`iNextVersion`),
  ADD KEY `bDeleted` (`bDeleted`);

--
-- Indexes for table `history_tm_tasks_subtasks`
--
ALTER TABLE `history_tm_tasks_subtasks`
  ADD PRIMARY KEY (`historyID`),
  ADD KEY `idTask` (`idTask`),
  ADD KEY `iVersion` (`iVersion`),
  ADD KEY `iNextVersion` (`iNextVersion`),
  ADD KEY `bDeleted` (`bDeleted`);

--
-- Indexes for table `history_tm_tasks_tests`
--
ALTER TABLE `history_tm_tasks_tests`
  ADD PRIMARY KEY (`historyID`),
  ADD KEY `iVersion` (`iVersion`),
  ADD KEY `iNextVersion` (`iNextVersion`),
  ADD KEY `bDeleted` (`bDeleted`),
  ADD KEY `TaskGroup` (`idTask`,`sGroupType`),
  ADD KEY `TaskGroupUser` (`idTask`,`sGroupType`,`idUser`,`idPlatform`),
  ADD KEY `idUser` (`idUser`,`idPlatform`),
  ADD KEY `idTask` (`idTask`);

--
-- Indexes for table `schema_revision`
--
ALTER TABLE `schema_revision`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `synchro_version`
--
ALTER TABLE `synchro_version`
  ADD UNIQUE KEY `iVersion_2` (`iVersion`),
  ADD KEY `iVersion` (`iVersion`);

--
-- Indexes for table `test_sync_main`
--
ALTER TABLE `test_sync_main`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `iVersion` (`iVersion`);

--
-- Indexes for table `test_sync_second`
--
ALTER TABLE `test_sync_second`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `iVersion` (`iVersion`);

--
-- Indexes for table `test_sync_third`
--
ALTER TABLE `test_sync_third`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `iVersion` (`iVersion`);

--
-- Indexes for table `tm_grader_checks`
--
ALTER TABLE `tm_grader_checks`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `synchro` (`iVersion`),
  ADD KEY `idTask` (`idTask`);

--
-- Indexes for table `tm_hints`
--
ALTER TABLE `tm_hints`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `idTask` (`idTask`),
  ADD KEY `synchro` (`iVersion`);

--
-- Indexes for table `tm_hints_strings`
--
ALTER TABLE `tm_hints_strings`
  ADD PRIMARY KEY (`ID`),
  ADD UNIQUE KEY `idHintsLanguage` (`idHint`,`sLanguage`),
  ADD KEY `idHint` (`idHint`),
  ADD KEY `synchro` (`iVersion`);

--
-- Indexes for table `tm_platforms`
--
ALTER TABLE `tm_platforms`
  ADD PRIMARY KEY (`ID`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `tm_recordings`
--
ALTER TABLE `tm_recordings`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `idTask` (`idTask`),
  ADD KEY `synchro` (`iVersion`);

--
-- Indexes for table `tm_remote_secret`
--
ALTER TABLE `tm_remote_secret`
  ADD PRIMARY KEY (`idUser`,`idPlatform`);

--
-- Indexes for table `tm_solutions`
--
ALTER TABLE `tm_solutions`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `idTask` (`idTask`),
  ADD KEY `synchro` (`iVersion`);

--
-- Indexes for table `tm_solutions_strings`
--
ALTER TABLE `tm_solutions_strings`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `idSolution` (`idSolution`),
  ADD KEY `idSolutionsLanguage` (`idSolution`,`sLanguage`),
  ADD KEY `synchro` (`iVersion`);

--
-- Indexes for table `tm_source_codes`
--
ALTER TABLE `tm_source_codes`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `UserTask` (`idUser`,`idTask`,`idPlatform`),
  ADD KEY `idTask` (`idTask`),
  ADD KEY `synchro` (`iVersion`);

--
-- Indexes for table `tm_submissions`
--
ALTER TABLE `tm_submissions`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `synchro` (`iVersion`),
  ADD KEY `checksum` (`iChecksum`),
  ADD KEY `date` (`sDate`),
  ADD KEY `idUser` (`idUser`,`idPlatform`),
  ADD KEY `idTask` (`idTask`),
  ADD KEY `userTask` (`idTask`,`idUser`,`idPlatform`),
  ADD KEY `idSourceCode` (`idSourceCode`);

--
-- Indexes for table `tm_submissions_subtasks`
--
ALTER TABLE `tm_submissions_subtasks`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `synchro` (`iVersion`),
  ADD KEY `idSubtask` (`idSubtask`),
  ADD KEY `idSubmission` (`idSubmission`);

--
-- Indexes for table `tm_submissions_tests`
--
ALTER TABLE `tm_submissions_tests`
  ADD PRIMARY KEY (`ID`),
  ADD UNIQUE KEY `idSubmissionTest` (`idSubmission`,`idTest`),
  ADD KEY `synchro` (`iVersion`),
  ADD KEY `idSubmission` (`idSubmission`),
  ADD KEY `idTest` (`idTest`);

--
-- Indexes for table `tm_tasks`
--
ALTER TABLE `tm_tasks`
  ADD PRIMARY KEY (`ID`),
  ADD UNIQUE KEY `sTextId` (`sTextId`),
  ADD UNIQUE KEY `pathRev` (`sTaskPath`,`sRevision`),
  ADD KEY `synchro` (`iVersion`);

--
-- Indexes for table `tm_tasks_limits`
--
ALTER TABLE `tm_tasks_limits`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `idTask` (`idTask`),
  ADD KEY `iVersion` (`iVersion`);

--
-- Indexes for table `tm_tasks_strings`
--
ALTER TABLE `tm_tasks_strings`
  ADD PRIMARY KEY (`ID`),
  ADD UNIQUE KEY `idTasksLang` (`idTask`,`sLanguage`),
  ADD KEY `idTask` (`idTask`),
  ADD KEY `iVersion` (`iVersion`);

--
-- Indexes for table `tm_tasks_subtasks`
--
ALTER TABLE `tm_tasks_subtasks`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `synchro` (`iVersion`),
  ADD KEY `idTask` (`idTask`);

--
-- Indexes for table `tm_tasks_tests`
--
ALTER TABLE `tm_tasks_tests`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `TestName` (`sName`),
  ADD KEY `synchro` (`iVersion`),
  ADD KEY `TaskGroup` (`idTask`,`sGroupType`),
  ADD KEY `TaskGroupUser` (`idTask`,`sGroupType`,`idUser`,`idPlatform`),
  ADD KEY `idUser` (`idUser`,`idPlatform`),
  ADD KEY `idSubtask` (`idSubtask`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `error_log`
--
ALTER TABLE `error_log`
  MODIFY `ID` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `history_test_sync_main`
--
ALTER TABLE `history_test_sync_main`
  MODIFY `historyID` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `history_test_sync_second`
--
ALTER TABLE `history_test_sync_second`
  MODIFY `historyID` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `history_test_sync_third`
--
ALTER TABLE `history_test_sync_third`
  MODIFY `historyID` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `history_tm_hints`
--
ALTER TABLE `history_tm_hints`
  MODIFY `historyID` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `history_tm_hints_strings`
--
ALTER TABLE `history_tm_hints_strings`
  MODIFY `historyID` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `history_tm_recordings`
--
ALTER TABLE `history_tm_recordings`
  MODIFY `historyID` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `history_tm_solutions`
--
ALTER TABLE `history_tm_solutions`
  MODIFY `historyID` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `history_tm_solutions_strings`
--
ALTER TABLE `history_tm_solutions_strings`
  MODIFY `historyID` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `history_tm_source_codes`
--
ALTER TABLE `history_tm_source_codes`
  MODIFY `historyID` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `history_tm_submissions`
--
ALTER TABLE `history_tm_submissions`
  MODIFY `historyID` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `history_tm_submissions_subtasks`
--
ALTER TABLE `history_tm_submissions_subtasks`
  MODIFY `historyID` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `history_tm_submissions_tests`
--
ALTER TABLE `history_tm_submissions_tests`
  MODIFY `historyID` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `history_tm_tasks`
--
ALTER TABLE `history_tm_tasks`
  MODIFY `historyID` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `history_tm_tasks_limits`
--
ALTER TABLE `history_tm_tasks_limits`
  MODIFY `historyID` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `history_tm_tasks_strings`
--
ALTER TABLE `history_tm_tasks_strings`
  MODIFY `historyID` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `history_tm_tasks_subtasks`
--
ALTER TABLE `history_tm_tasks_subtasks`
  MODIFY `historyID` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `history_tm_tasks_tests`
--
ALTER TABLE `history_tm_tasks_tests`
  MODIFY `historyID` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `schema_revision`
--
ALTER TABLE `schema_revision`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `tm_submissions_tests`
--
ALTER TABLE `tm_submissions_tests`
  ADD CONSTRAINT `tm_submissions_tests_ibfk_1` FOREIGN KEY (`idTest`) REFERENCES `tm_tasks_tests` (`ID`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `tm_tasks_tests`
--
ALTER TABLE `tm_tasks_tests`
  ADD CONSTRAINT `tm_tasks_tests_subtask` FOREIGN KEY (`idSubtask`) REFERENCES `tm_tasks_subtasks` (`ID`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `tm_tasks_tests_task` FOREIGN KEY (`idTask`) REFERENCES `tm_tasks` (`ID`) ON DELETE CASCADE ON UPDATE CASCADE;
