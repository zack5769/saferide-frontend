import TurnRightIcon from "@mui/icons-material/TurnRight";
import TurnLeftIcon from "@mui/icons-material/TurnLeft";
import StraightIcon from "@mui/icons-material/Straight";
import FlagIcon from "@mui/icons-material/Flag";
import type { SvgIconProps } from "@mui/material/SvgIcon";

interface InstructionIconProps extends Omit<SvgIconProps, 'children'> {
    sign: number;
}

export default function InstructionIcon({ sign, ...props }: InstructionIconProps) {
    const getIcon = () => {
        switch (sign) {
            case -3: case -2: // Turn left / sharp left
                return <TurnLeftIcon {...props} />;
            case -1: // Turn slight left
                return <TurnLeftIcon color="disabled" {...props} />;
            case 0: // Continue straight
                return <StraightIcon color="primary" {...props} />;
            case 1: // Turn slight right
                return <TurnRightIcon color="disabled" {...props} />;
            case 2: case 3: // Turn right / sharp right
                return <TurnRightIcon color="primary" {...props} />;
            case 7: // Keep right
                return <TurnRightIcon color="action" {...props} />;
            case -7: // Keep left
                return <TurnLeftIcon color="action" {...props} />;
            case 4: // Arrive
                return <FlagIcon color="success" {...props} />;
            default:
                return <StraightIcon color="primary" {...props} />;
        }
    };

    return getIcon();
}