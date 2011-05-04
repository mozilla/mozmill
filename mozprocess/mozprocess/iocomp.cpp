**************************************
Global variables and defines
**************************************

// Handles required
HANDLE hIOCP;            // Completion port that receives Job notifications
HANDLE hThreadIOCP;        // Completion port thread
HANDLE hJob;            // Job Object

// Completion keys for the completion port
#define COMPKEY_TERMINATE  ((UINT_PTR) 0)
#define COMPKEY_JOBOBJECT  ((UINT_PTR) 1)

**************************************
// This is the thread function which polls and dequeues the messages
**************************************
DWORD WINAPI JobNotify(PVOID)
{
    TCHAR sz[2000];
    BOOL fDone = FALSE;
    BOOL fGotCompStat = FALSE;

    while (!fDone)
        {
        DWORD dwBytesXferred;
        ULONG_PTR CompKey;
        LPOVERLAPPED po;

        // Get queued completion status (times out after 2 secs.)
        fGotCompStat = GetQueuedCompletionStatus(hIOCP, &dwBytesXferred,
&CompKey, &po, 2000);

        // if the function returns false and po is null we have either timed out or the i/0
        // completion port has been closed
        if (!fGotCompStat && (po == NULL))
            {
            DWORD dwRet = GetLastError();
            // if the port has been closed bail otherwise poll again
            if (dwRet == ERROR_ABANDONED_WAIT_0)
                {
                fDone = TRUE;
                }
            continue;
            }

        // The app is shutting down, exit this thread
        fDone = (CompKey == COMPKEY_TERMINATE);

        // this is the key passed when the process was added to the job object
        if (CompKey == COMPKEY_JOBOBJECT)
            {
            switch (dwBytesXferred)
                {
                // Process count is zero, we're probably done here
                case JOB_OBJECT_MSG_ACTIVE_PROCESS_ZERO:
                    break;

                // A new process has been added to the job object, the PID is in the po variable
                case JOB_OBJECT_MSG_NEW_PROCESS:
                    break;

                // One of the processes has exited, the PID is in the po variable
                case JOB_OBJECT_MSG_EXIT_PROCESS:
                    break;

                // One of the processes has exited abnormally, the PID is in the po variable
                case JOB_OBJECT_MSG_ABNORMAL_EXIT_PROCESS:
                    break;

                // Ignore any other message
                default:
                    break;
                }
            }
        }
}

**************************************
This is the setup code
**************************************
    // Create the I/O completion port
    hIOCP = CreateIoCompletionPort(INVALID_HANDLE_VALUE, NULL, 0, 0);

    // create the job object
    hJob = CreateJobObject(NULL, _T("foo"));
    if (hJob != NULL)
        {
        // set the job object to kill children on job close also allow breakaways
        JOBOBJECT_EXTENDED_LIMIT_INFORMATION jeli = { 0 };
        jeli.BasicLimitInformation.LimitFlags = JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE |
                                                JOB_OBJECT_LIMIT_BREAKAWAY_OK;
        if( 0 == SetInformationJobObject( hJob,
                                          JobObjectExtendedLimitInformation,
                                          &jeli, sizeof(jeli)))
            {
                ::MessageBox( 0, 
                              _T("Could not SetInformationJobObject"),
                              _T("Error"), MB_OK);
            }

        // set the job object to send notifications using the COMPKEY_JOBOBJECT key constant
        JOBOBJECT_ASSOCIATE_COMPLETION_PORT joacp = { (PVOID) COMPKEY_JOBOBJECT, hIOCP };
        if (0 == SetInformationJobObject(hJob, JobObjectAssociateCompletionPortInformation,
                                         &joacp, sizeof(joacp)))
            {
                ::MessageBox( 0, _T("Could not Associate Completion Port"), _T("Error"), MB_OK);
            }
        }

    // Create a thread that waits on the completion port
    hThreadIOCP = CreateThread(NULL, 0, JobNotify, NULL, 0, NULL);

**************************************
This is the cleanup code
**************************************
        // Post a special key that tells the completion port thread to terminate
    PostQueuedCompletionStatus(hIOCP, 0, COMPKEY_TERMINATE, NULL);

    // Wait for the completion port thread to terminate
    WaitForSingleObject(hThreadIOCP, INFINITE);

    // Clean up everything properly
    CloseHandle(hIOCP);
    CloseHandle(hThreadIOCP);